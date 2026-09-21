const Guardian = require('../../models/Guardian');
const Student = require('../../models/Student');
const AttendanceRecord = require('../../models/AttendanceRecord');
const AttendanceSession = require('../../models/AttendanceSession');
const Homework = require('../../models/Homework');
const HomeworkSubmission = require('../../models/HomeworkSubmission');
const SubjectGrade = require('../../models/SubjectGrade');
const Notification = require('../../models/Notification');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.getDashboard = asyncHandler(async (req, res) => {
  const guardian = await Guardian.findOne({ userId: req.user._id });
  if (!guardian) throw new ApiError(404, 'Guardian not found');
  const children = await Student.find({ _id: { $in: guardian.studentIds } }).populate('classId', 'name section gradeNumber');
  const childData = await Promise.all(children.map(async (child) => {
    const sessions = await AttendanceSession.find({ classId: child.classId._id }).select('_id');
    const records = await AttendanceRecord.find({ studentId: child._id, attendanceSessionId: { $in: sessions.map(s => s._id) } });
    const present = records.filter(r => r.status === 'PRESENT').length;
    const pct = sessions.length ? Math.round((present / sessions.length) * 100) : 0;
    const pendingHw = await Homework.countDocuments({ classId: child.classId._id, status: 'PUBLISHED', dueAt: { $gte: new Date() } });
    const grades = await SubjectGrade.find({ studentId: child._id }).populate('subjectId', 'code name nameBn').sort({ grade: 1 });
    return { student: child, attendancePercentage: pct, presentCount: present, totalSessions: sessions.length, pendingHomework: pendingHw, grades };
  }));
  const unread = await Notification.countDocuments({ recipientUserId: req.user._id, isRead: false });
  res.json({ success: true, data: { children: childData, unreadNotifications: unread } });
});
