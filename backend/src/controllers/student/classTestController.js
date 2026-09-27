const Student = require('../../models/Student');
const ClassTest = require('../../models/ClassTest');
const TestAttempt = require('../../models/TestAttempt');
const { finalize, isPastDeadline } = require('../../services/classTestService');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

async function currentStudent(req) {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new ApiError(404, 'Student profile not found');
  return student;
}

async function classTest(student, id) {
  const test = await ClassTest.findOne({ _id: id, classId: student.classId, status: 'PUBLISHED' })
    .populate('subjectId', 'code name nameBn')
    .populate('teacherId', 'fullName');
  if (!test) throw new ApiError(404, 'Test not found');
  return test;
}

/** Questions as the student sees them while sitting the test: no answers. */
const paperFor = (test) =>
  test.questions.map((q) => ({ _id: q._id, kind: q.kind, text: q.text, options: q.kind === 'MCQ' ? q.options : undefined, marks: q.marks }));

/** Time's-up attempts are handed in with whatever was saved. */
async function settle(test, attempt) {
  if (attempt && attempt.status === 'IN_PROGRESS' && isPastDeadline(attempt)) {
    await finalize(test, attempt, { auto: true });
  }
  return attempt;
}

exports.list = asyncHandler(async (req, res) => {
  const student = await currentStudent(req);
  const tests = await ClassTest.find({ classId: student.classId, status: 'PUBLISHED' })
    .populate('subjectId', 'code name nameBn')
    .populate('teacherId', 'fullName')
    .sort({ opensAt: -1 });
  const attempts = await TestAttempt.find({ studentId: student._id, testId: { $in: tests.map((t) => t._id) } });
  const byTest = Object.fromEntries(attempts.map((a) => [String(a.testId), a]));
  for (const t of tests) await settle(t, byTest[String(t._id)]);

  res.json({
    success: true,
    data: tests.map((t) => {
      const a = byTest[String(t._id)];
      return {
        _id: t._id,
        title: t.title,
        instructions: t.instructions,
        subjectId: t.subjectId,
        teacher: t.teacherId,
        durationMinutes: t.durationMinutes,
        opensAt: t.opensAt,
        closesAt: t.closesAt,
        questionCount: t.questions.length,
        totalMarks: t.totalMarks,
        resultsPublished: t.resultsPublished,
        attempt: a
          ? { status: a.status, deadline: a.deadline, submittedAt: a.submittedAt, score: t.resultsPublished ? a.score : undefined }
          : null
      };
    }),
    serverTime: new Date()
  });
});

/** Starts the test, or resumes it with the same deadline. */
exports.start = asyncHandler(async (req, res) => {
  const student = await currentStudent(req);
  const test = await classTest(student, req.params.id);
  let attempt = await TestAttempt.findOne({ testId: test._id, studentId: student._id });
  await settle(test, attempt);

  if (attempt && attempt.status !== 'IN_PROGRESS') throw new ApiError(409, 'You have already handed in this test');
  if (!attempt) {
    const now = new Date();
    if (now < test.opensAt) throw new ApiError(409, 'This test has not opened yet');
    if (now >= test.closesAt) throw new ApiError(409, 'This test has closed');
    const deadline = new Date(Math.min(now.getTime() + test.durationMinutes * 60_000, test.closesAt.getTime()));
    try {
      attempt = await TestAttempt.create({ testId: test._id, studentId: student._id, startedAt: now, deadline });
    } catch (err) {
      // Two tabs pressing Start at once: use the attempt the other created.
      if (err.code !== 11000) throw err;
      attempt = await TestAttempt.findOne({ testId: test._id, studentId: student._id });
    }
  }

  res.json({
    success: true,
    data: {
      test: {
        _id: test._id,
        title: test.title,
        instructions: test.instructions,
        subjectId: test.subjectId,
        durationMinutes: test.durationMinutes,
        totalMarks: test.totalMarks,
        questions: paperFor(test)
      },
      attempt: { _id: attempt._id, startedAt: attempt.startedAt, deadline: attempt.deadline, answers: attempt.answers, status: attempt.status },
      serverTime: new Date()
    }
  });
});

function applyAnswers(test, attempt, answers) {
  const questions = new Map(test.questions.map((q) => [String(q._id), q]));
  const next = [];
  for (const a of Array.isArray(answers) ? answers : []) {
    const q = questions.get(String(a.questionId));
    if (!q) continue;
    if (q.kind === 'MCQ') {
      const option = Number(a.option);
      if (Number.isInteger(option) && option >= 0 && option < q.options.length) next.push({ questionId: q._id, option });
    } else if (typeof a.text === 'string') {
      next.push({ questionId: q._id, text: a.text.slice(0, 5000) });
    }
  }
  attempt.answers = next;
}

/** Autosave while the clock runs. */
exports.saveAnswers = asyncHandler(async (req, res) => {
  const student = await currentStudent(req);
  const test = await classTest(student, req.params.id);
  const attempt = await TestAttempt.findOne({ testId: test._id, studentId: student._id });
  if (!attempt) throw new ApiError(404, 'Start the test first');
  if (attempt.status !== 'IN_PROGRESS' || isPastDeadline(attempt)) {
    await settle(test, attempt);
    throw new ApiError(409, 'Time is up — your saved answers have been handed in');
  }
  applyAnswers(test, attempt, req.body.answers);
  await attempt.save();
  res.json({ success: true, data: { savedAt: new Date() } });
});

exports.submit = asyncHandler(async (req, res) => {
  const student = await currentStudent(req);
  const test = await classTest(student, req.params.id);
  const attempt = await TestAttempt.findOne({ testId: test._id, studentId: student._id });
  if (!attempt) throw new ApiError(404, 'Start the test first');
  if (attempt.status !== 'IN_PROGRESS') return res.json({ success: true, data: { status: attempt.status } });
  // Within the time (plus a few seconds' grace) the final answers count;
  // after it, only what was already autosaved does.
  const late = isPastDeadline(attempt);
  if (!late) applyAnswers(test, attempt, req.body.answers);
  await finalize(test, attempt, { auto: late });
  res.json({ success: true, data: { status: attempt.status, autoSubmitted: attempt.autoSubmitted } });
});

/** The marked paper, once the teacher publishes results. */
exports.result = asyncHandler(async (req, res) => {
  const student = await currentStudent(req);
  const test = await classTest(student, req.params.id);
  if (!test.resultsPublished) throw new ApiError(409, 'Results for this test are not out yet');
  const attempt = await TestAttempt.findOne({ testId: test._id, studentId: student._id }).lean();
  const byId = new Map((attempt?.answers || []).map((a) => [String(a.questionId), a]));
  res.json({
    success: true,
    data: {
      test: { _id: test._id, title: test.title, subjectId: test.subjectId, totalMarks: test.totalMarks },
      attempt: attempt ? { score: attempt.score, submittedAt: attempt.submittedAt, autoSubmitted: attempt.autoSubmitted } : null,
      questions: test.questions.map((q) => {
        const a = byId.get(String(q._id));
        return {
          _id: q._id,
          kind: q.kind,
          text: q.text,
          options: q.options,
          correctOption: q.correctOption,
          marks: q.marks,
          yourOption: a?.option,
          yourText: a?.text,
          awarded: a?.awarded ?? 0
        };
      })
    }
  });
});
