const Student = require('../../models/Student');
const Mark = require('../../models/Mark');
const Homework = require('../../models/Homework');
const HomeworkSubmission = require('../../models/HomeworkSubmission');
const SubjectGrade = require('../../models/SubjectGrade');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.getResults = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new ApiError(404, 'Student not found');

  const [marks, grades, graded] = await Promise.all([
    Mark.find({ studentId: student._id }).populate({ path: 'assessmentId', populate: { path: 'subjectId', select: 'code name nameBn' } }),
    // Only grades the subject teacher has submitted as final — a draft is
    // still being worked on and isn't the student's result yet.
    SubjectGrade.find({ studentId: student._id, status: 'FINAL' }).populate('subjectId', 'code name nameBn'),
    HomeworkSubmission.find({ studentId: student._id, status: 'GRADED' })
      .select('homeworkId marks feedback gradedAt submittedAt')
      .sort({ gradedAt: -1 })
      .lean()
  ]);

  const homeworks = await Homework.find({ _id: { $in: graded.map((g) => g.homeworkId) } })
    .select('title type maxMarks dueAt subjectId')
    .populate('subjectId', 'code name nameBn')
    .lean();
  const hwMap = Object.fromEntries(homeworks.map((h) => [String(h._id), h]));
  const homework = graded
    .filter((g) => hwMap[String(g.homeworkId)])
    .map((g) => ({ ...g, homework: hwMap[String(g.homeworkId)] }));

  res.json({ success: true, data: { marks, grades, homework } });
});
