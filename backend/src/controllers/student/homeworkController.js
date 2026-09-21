const Student = require('../../models/Student');
const Homework = require('../../models/Homework');
const HomeworkSubmission = require('../../models/HomeworkSubmission');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.list = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new ApiError(404, 'Student not found');
  const homeworks = await Homework.find({ classId: student.classId, status: 'PUBLISHED' })
    .populate('subjectId', 'name').sort({ dueAt: 1 });
  const submissions = await HomeworkSubmission.find({ studentId: student._id, homeworkId: { $in: homeworks.map(h => h._id) } });
  const subMap = Object.fromEntries(submissions.map(s => [s.homeworkId.toString(), s]));
  const result = homeworks.map(hw => ({ ...hw.toObject(), submission: subMap[hw._id.toString()] || { status: 'NOT_SUBMITTED' } }));
  res.json({ success: true, data: result });
});

exports.submit = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  const hw = await Homework.findById(req.params.id);
  if (!hw) throw new ApiError(404, 'Homework not found');
  if (hw.classId.toString() !== student.classId.toString()) throw new ApiError(403, 'Not your homework');
  const isLate = new Date() > new Date(hw.dueAt);
  const existing = await HomeworkSubmission.findOne({ homeworkId: hw._id, studentId: student._id });
  if (existing && existing.status === 'GRADED') throw new ApiError(400, 'Already graded');
  const sub = await HomeworkSubmission.findOneAndUpdate(
    { homeworkId: hw._id, studentId: student._id },
    { answerText: req.body.answerText, submittedAt: new Date(), status: isLate ? 'LATE' : 'SUBMITTED', updatedAt: new Date() },
    { new: true, upsert: true }
  );
  res.json({ success: true, data: sub });
});
