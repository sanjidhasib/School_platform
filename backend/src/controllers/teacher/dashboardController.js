const Teacher = require('../../models/Teacher');
const Timetable = require('../../models/Timetable');
const TeacherAssignment = require('../../models/TeacherAssignment');
const Homework = require('../../models/Homework');
const HomeworkSubmission = require('../../models/HomeworkSubmission');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.getTodaySchedule = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new ApiError(404, 'Teacher profile not found');
  const assignments = await TeacherAssignment.find({ teacherId: teacher._id, isActive: true }).select('_id');
  const today = new Date().getDay();
  const schedule = await Timetable.find({
    teacherAssignmentId: { $in: assignments.map(a => a._id) },
    dayOfWeek: today,
    isActive: true
  }).populate('classId', 'name section gradeNumber room')
    .populate({ path: 'teacherAssignmentId', populate: { path: 'subjectId', select: 'name' } })
    .sort({ startTime: 1 });
  const pendingGrading = await HomeworkSubmission.countDocuments({
    status: 'SUBMITTED',
    homeworkId: { $in: (await Homework.find({ teacherId: teacher._id })).map(h => h._id) }
  });
  res.json({ success: true, data: { schedule, pendingGrading } });
});
