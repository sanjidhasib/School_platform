/**
 * Final subject grades, submitted by the teacher who teaches the subject.
 *
 * The starting point for each student is their weighted percentage across
 * the term's assessments (class tests, exams, …): Σ weight × marks/max ÷
 * Σ weight. The teacher can adjust it, save a draft, and submit — only
 * submitted (FINAL) grades reach students, guardians and report cards.
 */
const Teacher = require('../../models/Teacher');
const Student = require('../../models/Student');
const TeacherAssignment = require('../../models/TeacherAssignment');
const Assessment = require('../../models/Assessment');
const Mark = require('../../models/Mark');
const SubjectGrade = require('../../models/SubjectGrade');
const SchoolSettings = require('../../models/SchoolSettings');
const AcademicSession = require('../../models/AcademicSession');
const TeacherRequest = require('../../models/TeacherRequest');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

const TERMS = ['TERM_1', 'TERM_2', 'FINAL'];

async function context(req, assignmentId, term) {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new ApiError(404, 'Teacher profile not found');
  const assignment = await TeacherAssignment.findOne({ _id: assignmentId, teacherId: teacher._id, isActive: true })
    .populate('classId', 'name section gradeNumber')
    .populate('subjectId', 'code name nameBn');
  if (!assignment) throw new ApiError(403, 'That class and subject are not assigned to you');
  if (!TERMS.includes(term)) throw new ApiError(400, 'Choose a term');
  const [session, settings] = await Promise.all([
    AcademicSession.findOne({ isCurrent: true }),
    SchoolSettings.findOne().select('gradingScale').lean()
  ]);
  if (!session) throw new ApiError(400, 'No current academic year is set up');
  const scale = [...(settings?.gradingScale || [])].sort((a, b) => b.minPercentage - a.minPercentage);
  if (!scale.length) throw new ApiError(400, 'The school has no grading scale set up');
  return { teacher, assignment, session, scale };
}

const gradeFor = (scale, pct) => scale.find((g) => pct >= g.minPercentage) || scale[scale.length - 1];

exports.get = asyncHandler(async (req, res) => {
  const { assignment, session, scale } = await context(req, req.query.assignmentId, req.query.term);
  const term = req.query.term;

  const [students, assessments, existing] = await Promise.all([
    Student.find({ classId: assignment.classId._id, status: 'ACTIVE' }).select('fullName rollNumber').lean(),
    Assessment.find({ teacherAssignmentId: assignment._id, term, academicSessionId: session._id })
      .select('title type maxMarks weight assessmentDate status')
      .sort({ assessmentDate: 1 })
      .lean(),
    SubjectGrade.find({ classId: assignment.classId._id, subjectId: assignment.subjectId._id, academicSessionId: session._id, term }).lean()
  ]);
  const marks = await Mark.find({ assessmentId: { $in: assessments.map((a) => a._id) } }).lean();
  const markOf = {};
  for (const m of marks) (markOf[String(m.studentId)] ||= {})[String(m.assessmentId)] = m;
  const gradeOf = Object.fromEntries(existing.map((g) => [String(g.studentId), g]));

  students.sort((a, b) => (parseInt(a.rollNumber, 10) || 0) - (parseInt(b.rollNumber, 10) || 0) || a.fullName.localeCompare(b.fullName));

  const rows = students.map((s) => {
    let num = 0, den = 0;
    const perAssessment = assessments.map((a) => {
      const m = markOf[String(s._id)]?.[String(a._id)];
      if (!m) return null;
      const got = m.absent ? 0 : Number(m.obtainedMarks) || 0;
      const w = Number(a.weight) || 1;
      num += w * (got / (a.maxMarks || 1));
      den += w;
      return m.absent ? 'ABS' : got;
    });
    const suggested = den ? Math.round((num / den) * 1000) / 10 : null;
    const g = gradeOf[String(s._id)];
    return {
      student: s,
      marks: perAssessment,
      suggested,
      saved: g ? { percentage: g.percentage, grade: g.grade, gradePoint: g.gradePoint, status: g.status, remarks: g.remarks } : null
    };
  });

  res.json({
    success: true,
    data: {
      assignment: { _id: assignment._id, class: assignment.classId, subject: assignment.subjectId },
      term,
      scale,
      assessments,
      rows,
      submitted: existing.some((g) => g.status === 'FINAL')
    }
  });
});

/** { assignmentId, term, grades: [{ studentId, percentage, remarks }], submit } */
exports.save = asyncHandler(async (req, res) => {
  const { assignmentId, term, submit } = req.body;
  const { assignment, session, scale } = await context(req, assignmentId, term);
  const grades = Array.isArray(req.body.grades) ? req.body.grades : [];
  if (!grades.length) throw new ApiError(400, 'Enter at least one grade');

  const classStudents = new Set(
    (await Student.find({ classId: assignment.classId._id, status: 'ACTIVE' }).select('_id').lean()).map((s) => String(s._id))
  );
  const already = await SubjectGrade.exists({
    classId: assignment.classId._id, subjectId: assignment.subjectId._id, academicSessionId: session._id, term, status: 'FINAL'
  });
  // Submitted grades stay submitted: corrections keep them visible to
  // students rather than silently pulling them back to a draft.
  const status = submit || already ? 'FINAL' : 'DRAFT';

  const ops = grades.map((g) => {
    if (!classStudents.has(String(g.studentId))) throw new ApiError(400, 'A student in the list is not in this class');
    const pct = Number(g.percentage);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw new ApiError(400, 'Percentages must be between 0 and 100');
    const band = gradeFor(scale, pct);
    return {
      updateOne: {
        filter: { studentId: g.studentId, subjectId: assignment.subjectId._id, academicSessionId: session._id, term },
        update: {
          $set: {
            classId: assignment.classId._id,
            teacherAssignmentId: assignment._id,
            percentage: Math.round(pct * 10) / 10,
            grade: band.grade,
            gradePoint: band.gradePoint,
            remarks: g.remarks ? String(g.remarks).slice(0, 200) : undefined,
            status,
            assignedBy: req.user._id,
            assignedAt: new Date()
          }
        },
        upsert: true
      }
    };
  });
  await SubjectGrade.bulkWrite(ops);

  let closed = 0;
  if (status === 'FINAL') {
    const r = await TeacherRequest.updateMany(
      { teacherAssignmentId: assignment._id, type: 'GRADES', status: 'OPEN', $or: [{ term }, { term: { $exists: false } }] },
      { status: 'DONE', completedAt: new Date() }
    );
    closed = r.modifiedCount;
  }
  res.json({ success: true, data: { saved: ops.length, status, requestsClosed: closed } });
});

// ── Requests from the office ───────────────────────────────────────────────

exports.requests = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new ApiError(404, 'Teacher profile not found');
  const list = await TeacherRequest.find({ teacherId: teacher._id, status: { $ne: 'CANCELLED' } })
    .populate('classId', 'name section')
    .populate('subjectId', 'code name nameBn')
    .sort({ status: -1, dueDate: 1, createdAt: -1 })
    .limit(50)
    .lean();
  res.json({ success: true, data: list });
});

/** Attendance requests are closed by the teacher once the register is up to date. */
exports.completeRequest = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  const r = await TeacherRequest.findOne({ _id: req.params.id, teacherId: teacher?._id });
  if (!r) throw new ApiError(404, 'Request not found');
  if (r.type === 'GRADES') throw new ApiError(409, 'This closes itself when you submit the final grades');
  r.status = 'DONE';
  r.completedAt = new Date();
  await r.save();
  res.json({ success: true, data: r });
});
