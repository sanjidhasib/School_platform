const Teacher = require('../../models/Teacher');
const TeacherAssignment = require('../../models/TeacherAssignment');
const Assessment = require('../../models/Assessment');
const Mark = require('../../models/Mark');
const SubjectGrade = require('../../models/SubjectGrade');
const Student = require('../../models/Student');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.createAssessment = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new ApiError(404, 'Teacher profile not found');
  const assessment = await Assessment.create({ ...req.body, teacherId: teacher._id });
  res.status(201).json({ success: true, data: assessment });
});

exports.listAssessments = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  const assessments = await Assessment.find({ teacherId: teacher._id })
    .populate('classId', 'name section')
    .populate('subjectId', 'name')
    .sort({ assessmentDate: -1 });
  res.json({ success: true, data: assessments });
});

exports.getMarks = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new ApiError(404, 'Teacher profile not found');

  const assessment = await Assessment.findById(req.params.id)
    .populate('classId', 'name section')
    .populate('subjectId', 'name nameBn');
  if (!assessment) throw new ApiError(404, 'Assessment not found');
  if (String(assessment.teacherId) !== String(teacher._id)) {
    throw new ApiError(403, 'This assessment belongs to another teacher');
  }

  const [students, marks] = await Promise.all([
    Student.find({ classId: assessment.classId._id, status: 'ACTIVE' })
      .select('fullName studentId rollNumber photoUrl')
      .sort({ fullName: 1 }),
    Mark.find({ assessmentId: assessment._id })
  ]);

  const byStudent = {};
  marks.forEach((m) => {
    byStudent[String(m.studentId)] = { obtainedMarks: m.obtainedMarks, absent: m.absent, remarks: m.remarks };
  });

  res.json({ success: true, data: { assessment, students, marks: byStudent } });
});

exports.saveMarks = asyncHandler(async (req, res) => {
  const { marks } = req.body; // [{studentId, obtainedMarks, absent, remarks}]
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) throw new ApiError(404, 'Assessment not found');
  if (assessment.status === 'LOCKED') throw new ApiError(403, 'Assessment is locked');
  const ops = marks.map(m => ({
    updateOne: {
      filter: { assessmentId: assessment._id, studentId: m.studentId },
      update: { $set: { obtainedMarks: m.obtainedMarks, absent: m.absent || false, remarks: m.remarks, enteredBy: req.user._id, enteredAt: new Date(), updatedAt: new Date() } },
      upsert: true
    }
  }));
  await Mark.bulkWrite(ops);
  res.json({ success: true, message: 'Marks saved' });
});

exports.saveGrades = asyncHandler(async (req, res) => {
  const { grades } = req.body; // [{studentId, subjectId, classId, academicSessionId, term, percentage, grade, gradePoint}]
  const ops = grades.map(g => ({
    updateOne: {
      filter: { studentId: g.studentId, subjectId: g.subjectId, academicSessionId: g.academicSessionId, term: g.term },
      update: { $set: { ...g, assignedBy: req.user._id, assignedAt: new Date(), updatedAt: new Date() } },
      upsert: true
    }
  }));
  await SubjectGrade.bulkWrite(ops);
  res.json({ success: true, message: 'Grades saved' });
});
