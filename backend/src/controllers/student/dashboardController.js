const Student = require('../../models/Student');
const AttendanceRecord = require('../../models/AttendanceRecord');
const AttendanceSession = require('../../models/AttendanceSession');
const Homework = require('../../models/Homework');
const HomeworkSubmission = require('../../models/HomeworkSubmission');
const SubjectGrade = require('../../models/SubjectGrade');
const Notice = require('../../models/Notice');
const Timetable = require('../../models/Timetable');
const Notification = require('../../models/Notification');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.getDashboard = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id }).populate('classId');
  if (!student) throw new ApiError(404, 'Student profile not found');
  const today = new Date().getDay();
  const [todaySchedule, sessions, submissions, pendingHw, unreadCount, notices] = await Promise.all([
    Timetable.find({ classId: student.classId, dayOfWeek: today, isActive: true })
      .populate({ path: 'teacherAssignmentId', populate: { path: 'subjectId', select: 'name' } })
      .sort({ startTime: 1 }),
    AttendanceSession.find({ classId: student.classId._id }).select('_id'),
    AttendanceRecord.find({ studentId: student._id }).select('status'),
    Homework.find({ classId: student.classId._id, status: 'PUBLISHED', dueAt: { $gte: new Date() } }).sort({ dueAt: 1 }).limit(5).populate('subjectId', 'name'),
    Notification.countDocuments({ recipientUserId: req.user._id, isRead: false }),
    Notice.find({ isPublished: true }).sort({ createdAt: -1 }).limit(3)
  ]);
  const present = submissions.filter(s => s.status === 'PRESENT').length;
  const attendancePct = sessions.length ? Math.round((present / sessions.length) * 100) : 0;
  res.json({ success: true, data: { student, todaySchedule, attendancePercentage: attendancePct, totalSessions: sessions.length, presentCount: present, pendingHomework: pendingHw, unreadNotifications: unreadCount, recentNotices: notices } });
});
