const Teacher = require('../../models/Teacher');
const Student = require('../../models/Student');
const TeacherAssignment = require('../../models/TeacherAssignment');
const ClassTest = require('../../models/ClassTest');
const TestAttempt = require('../../models/TestAttempt');
const Assessment = require('../../models/Assessment');
const Mark = require('../../models/Mark');
const AcademicSession = require('../../models/AcademicSession');
const { finalizeExpired, scoreAttempt } = require('../../services/classTestService');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

async function currentTeacher(req) {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new ApiError(404, 'Teacher profile not found');
  return teacher;
}

async function ownTest(teacher, id) {
  const test = await ClassTest.findOne({ _id: id, teacherId: teacher._id })
    .populate('classId', 'name section gradeNumber')
    .populate('subjectId', 'code name nameBn');
  if (!test) throw new ApiError(404, 'Test not found');
  return test;
}

/** Checks and tidies what the form sends; throws a readable message. */
function cleanTest(body, { requireQuestions }) {
  const out = {};
  if (body.title !== undefined) {
    out.title = String(body.title).trim();
    if (!out.title) throw new ApiError(400, 'Give the test a title');
  }
  if (body.instructions !== undefined) out.instructions = String(body.instructions);
  if (body.durationMinutes !== undefined) {
    out.durationMinutes = Number(body.durationMinutes);
    if (!Number.isFinite(out.durationMinutes) || out.durationMinutes < 1 || out.durationMinutes > 300) {
      throw new ApiError(400, 'The time limit must be between 1 and 300 minutes');
    }
  }
  if (body.opensAt !== undefined) out.opensAt = new Date(body.opensAt);
  if (body.closesAt !== undefined) out.closesAt = new Date(body.closesAt);
  if ((out.opensAt && isNaN(out.opensAt)) || (out.closesAt && isNaN(out.closesAt))) {
    throw new ApiError(400, 'Choose when the test opens and closes');
  }
  if (out.opensAt && out.closesAt && out.closesAt <= out.opensAt) {
    throw new ApiError(400, 'The test must close after it opens');
  }
  if (body.questions !== undefined) {
    if (!Array.isArray(body.questions)) throw new ApiError(400, 'Invalid questions');
    out.questions = body.questions.map((q, i) => {
      const n = i + 1;
      const kind = q.kind === 'SHORT' ? 'SHORT' : 'MCQ';
      const text = String(q.text || '').trim();
      if (!text) throw new ApiError(400, `Question ${n} has no text`);
      const marks = Number(q.marks ?? 1);
      if (!Number.isFinite(marks) || marks < 0 || marks > 100) throw new ApiError(400, `Question ${n}: marks must be 0–100`);
      const clean = { kind, text, marks };
      if (q._id) clean._id = q._id;
      if (kind === 'MCQ') {
        const options = (q.options || []).map((o) => String(o || '').trim());
        if (options.length < 2 || options.some((o) => !o)) throw new ApiError(400, `Question ${n} needs at least two filled-in options`);
        const correct = Number(q.correctOption);
        if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) {
          throw new ApiError(400, `Question ${n}: mark which option is correct`);
        }
        clean.options = options;
        clean.correctOption = correct;
      }
      return clean;
    });
    if (requireQuestions && !out.questions.length) throw new ApiError(400, 'Add at least one question');
  }
  return out;
}

exports.list = asyncHandler(async (req, res) => {
  const teacher = await currentTeacher(req);
  const tests = await ClassTest.find({ teacherId: teacher._id })
    .populate('classId', 'name section')
    .populate('subjectId', 'code name nameBn')
    .sort({ opensAt: -1 });
  const counts = await TestAttempt.aggregate([
    { $match: { testId: { $in: tests.map((t) => t._id) } } },
    { $group: { _id: '$testId', attempts: { $sum: 1 }, toMark: { $sum: { $cond: [{ $eq: ['$status', 'SUBMITTED'] }, 1, 0] } } } }
  ]);
  const byTest = Object.fromEntries(counts.map((c) => [String(c._id), c]));
  res.json({
    success: true,
    data: tests.map((t) => ({
      ...t.toObject(),
      questionCount: t.questions.length,
      attempts: byTest[String(t._id)]?.attempts ?? 0,
      toMark: byTest[String(t._id)]?.toMark ?? 0
    }))
  });
});

exports.get = asyncHandler(async (req, res) => {
  const teacher = await currentTeacher(req);
  const test = await ownTest(teacher, req.params.id);
  const attempts = await TestAttempt.countDocuments({ testId: test._id });
  res.json({ success: true, data: { ...test.toObject(), attempts } });
});

exports.create = asyncHandler(async (req, res) => {
  const teacher = await currentTeacher(req);
  const assignment = await TeacherAssignment.findOne({ _id: req.body.teacherAssignmentId, teacherId: teacher._id });
  if (!assignment) throw new ApiError(403, 'Choose one of your own classes');
  const data = cleanTest(req.body, { requireQuestions: false });
  if (!data.title || !data.durationMinutes || !data.opensAt || !data.closesAt) {
    throw new ApiError(400, 'Title, time limit and the open and close times are required');
  }
  const test = await ClassTest.create({
    ...data,
    teacherAssignmentId: assignment._id,
    classId: assignment.classId,
    subjectId: assignment.subjectId,
    teacherId: teacher._id,
    status: 'DRAFT'
  });
  res.status(201).json({ success: true, data: test });
});

exports.update = asyncHandler(async (req, res) => {
  const teacher = await currentTeacher(req);
  const test = await ownTest(teacher, req.params.id);
  const attempts = await TestAttempt.countDocuments({ testId: test._id });
  const data = cleanTest(req.body, { requireQuestions: test.status === 'PUBLISHED' });
  // Once students have sat it, the questions and timer are fixed — changing
  // them would make earlier scores meaningless. Timing can still move.
  if (attempts && (data.questions || data.durationMinutes !== undefined)) {
    throw new ApiError(409, 'Students have already started this test, so its questions and time limit can no longer change');
  }
  Object.assign(test, data);
  if ((data.opensAt || data.closesAt) && test.closesAt <= test.opensAt) throw new ApiError(400, 'The test must close after it opens');
  await test.save();
  res.json({ success: true, data: test });
});

exports.publish = asyncHandler(async (req, res) => {
  const teacher = await currentTeacher(req);
  const test = await ownTest(teacher, req.params.id);
  if (!test.questions.length) throw new ApiError(400, 'Add at least one question before publishing');
  if (test.closesAt <= new Date()) throw new ApiError(400, 'The closing time has already passed — move it later first');
  test.status = 'PUBLISHED';
  await test.save();
  res.json({ success: true, data: test });
});

/** Ends the test now: nobody new can start; anyone mid-test keeps their time. */
exports.close = asyncHandler(async (req, res) => {
  const teacher = await currentTeacher(req);
  const test = await ownTest(teacher, req.params.id);
  if (test.closesAt > new Date()) test.closesAt = new Date();
  if (test.opensAt > test.closesAt) test.opensAt = test.closesAt;
  await test.save();
  res.json({ success: true, data: test });
});

exports.remove = asyncHandler(async (req, res) => {
  const teacher = await currentTeacher(req);
  const test = await ownTest(teacher, req.params.id);
  if (await TestAttempt.exists({ testId: test._id })) {
    throw new ApiError(409, 'Students have already sat this test, so it cannot be deleted');
  }
  await test.deleteOne();
  res.json({ success: true, message: 'Test deleted' });
});

/** Every student in the class, with their attempt if they made one. */
exports.attempts = asyncHandler(async (req, res) => {
  const teacher = await currentTeacher(req);
  const test = await ownTest(teacher, req.params.id);
  await finalizeExpired(test);
  const [students, attempts] = await Promise.all([
    Student.find({ classId: test.classId._id, status: 'ACTIVE' }).select('fullName rollNumber').lean(),
    TestAttempt.find({ testId: test._id }).lean()
  ]);
  const byStudent = Object.fromEntries(attempts.map((a) => [String(a.studentId), a]));
  students.sort((a, b) => (parseInt(a.rollNumber, 10) || 0) - (parseInt(b.rollNumber, 10) || 0) || a.fullName.localeCompare(b.fullName));
  res.json({
    success: true,
    data: {
      test,
      rows: students.map((s) => ({ student: s, attempt: byStudent[String(s._id)] || null }))
    }
  });
});

/** The teacher marks short answers: { awards: { [questionId]: marks } }. */
exports.markAttempt = asyncHandler(async (req, res) => {
  const teacher = await currentTeacher(req);
  const attempt = await TestAttempt.findById(req.params.attemptId);
  if (!attempt) throw new ApiError(404, 'Attempt not found');
  const test = await ownTest(teacher, attempt.testId);
  if (attempt.status === 'IN_PROGRESS') throw new ApiError(409, 'The student is still sitting the test');
  const awards = req.body.awards || {};
  for (const q of test.questions.filter((x) => x.kind === 'SHORT')) {
    if (awards[q._id] === undefined) continue;
    const v = Number(awards[q._id]);
    if (!Number.isFinite(v) || v < 0 || v > q.marks) throw new ApiError(400, `Marks for “${q.text.slice(0, 40)}” must be between 0 and ${q.marks}`);
    let a = attempt.answers.find((x) => String(x.questionId) === String(q._id));
    if (!a) { attempt.answers.push({ questionId: q._id, text: '' }); a = attempt.answers[attempt.answers.length - 1]; }
    a.awarded = v;
  }
  scoreAttempt(test, attempt);
  attempt.markModified('answers');
  await attempt.save();
  res.json({ success: true, data: attempt });
});

/**
 * Posts the scores to the class's results as a class-test assessment, so
 * they appear on students' and guardians' Results pages with other marks.
 * Students who didn't sit the test are recorded as absent.
 */
exports.publishResults = asyncHandler(async (req, res) => {
  const teacher = await currentTeacher(req);
  const test = await ownTest(teacher, req.params.id);
  if (test.closesAt > new Date()) throw new ApiError(409, 'Close the test before publishing results');
  await finalizeExpired(test);
  if (await TestAttempt.exists({ testId: test._id, status: 'IN_PROGRESS' })) {
    throw new ApiError(409, 'Someone is still sitting the test — try again when their time is up');
  }
  if (await TestAttempt.exists({ testId: test._id, status: 'SUBMITTED' })) {
    throw new ApiError(409, 'Mark every short answer before publishing results');
  }

  const session = await AcademicSession.findOne({ isCurrent: true });
  if (!session) throw new ApiError(400, 'No current academic year is set up');
  const term = ['TERM_1', 'TERM_2', 'FINAL'].includes(req.body.term) ? req.body.term : 'TERM_1';

  let assessment = test.assessmentId ? await Assessment.findById(test.assessmentId) : null;
  const fields = {
    teacherAssignmentId: test.teacherAssignmentId,
    classId: test.classId._id,
    subjectId: test.subjectId._id,
    teacherId: teacher._id,
    academicSessionId: session._id,
    term,
    title: test.title,
    type: 'CLASS_TEST',
    assessmentDate: test.opensAt,
    maxMarks: test.totalMarks || 1,
    weight: Number(req.body.weight) > 0 ? Number(req.body.weight) : 10,
    status: 'PUBLISHED'
  };
  if (assessment) Object.assign(assessment, fields);
  else assessment = new Assessment(fields);
  await assessment.save();

  const [students, attempts] = await Promise.all([
    Student.find({ classId: test.classId._id, status: 'ACTIVE' }).select('_id').lean(),
    TestAttempt.find({ testId: test._id }).lean()
  ]);
  const byStudent = Object.fromEntries(attempts.map((a) => [String(a.studentId), a]));
  await Mark.bulkWrite(students.map((s) => {
    const a = byStudent[String(s._id)];
    return {
      updateOne: {
        filter: { assessmentId: assessment._id, studentId: s._id },
        update: {
          $set: {
            obtainedMarks: a ? a.score ?? 0 : null,
            absent: !a,
            remarks: a?.autoSubmitted ? 'Handed in automatically when time ran out' : undefined,
            enteredBy: req.user._id,
            enteredAt: new Date()
          }
        },
        upsert: true
      }
    };
  }));

  test.assessmentId = assessment._id;
  test.resultsPublished = true;
  await test.save();
  res.json({ success: true, data: test });
});
