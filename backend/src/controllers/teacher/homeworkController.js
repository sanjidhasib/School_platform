const Teacher = require('../../models/Teacher');
const Homework = require('../../models/Homework');
const HomeworkSubmission = require('../../models/HomeworkSubmission');
const Student = require('../../models/Student');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.create = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new ApiError(404, 'Teacher profile not found');
  const hw = await Homework.create({ ...req.body, teacherId: teacher._id, status: 'PUBLISHED' });
  res.status(201).json({ success: true, data: hw });
});

exports.list = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  const homeworks = await Homework.find({ teacherId: teacher._id })
    .populate('classId', 'name section')
    .populate('subjectId', 'code name nameBn')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: homeworks });
});

exports.getSubmissions = asyncHandler(async (req, res) => {
  const homework = await Homework.findById(req.params.id);
  if (!homework) throw new ApiError(404, 'Homework not found');
  const students = await Student.find({ classId: homework.classId, status: 'ACTIVE' });
  const submissions = await HomeworkSubmission.find({ homeworkId: homework._id }).populate('studentId', 'fullName studentId');
  const subMap = Object.fromEntries(submissions.map(s => [s.studentId._id.toString(), s]));
  const result = students.map(st => ({ student: st, submission: subMap[st._id.toString()] || { status: 'NOT_SUBMITTED' } }));
  res.json({ success: true, data: result });
});

exports.gradeSubmission = asyncHandler(async (req, res) => {
  const { marks, feedback } = req.body;
  const sub = await HomeworkSubmission.findByIdAndUpdate(req.params.id, {
    marks, feedback, status: 'GRADED', gradedAt: new Date(), gradedBy: req.user._id
  }, { new: true });
  if (!sub) throw new ApiError(404, 'Submission not found');
  res.json({ success: true, data: sub });
});
