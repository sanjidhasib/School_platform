const Student = require('../../models/Student');
const AttendanceRecord = require('../../models/AttendanceRecord');
const AttendanceSession = require('../../models/AttendanceSession');
const Homework = require('../../models/Homework');
const HomeworkSubmission = require('../../models/HomeworkSubmission');
const Notice = require('../../models/Notice');
const Timetable = require('../../models/Timetable');
const Notification = require('../../models/Notification');
const SchoolSettings = require('../../models/SchoolSettings');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

/**
 * The next day school is open after today. On a Thursday that's Sunday, not
 * Friday — "nothing due tomorrow" on a Thursday evening would be misleading
 * when the work is due first thing on Sunday.
 */
function nextSchoolDay(activeDays) {
  const days = activeDays?.length ? activeDays : [0, 1, 2, 3, 4];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 1; i <= 7; i++) {
    const c = new Date(d);
    c.setDate(d.getDate() + i);
    if (days.includes(c.getDay())) return c;
  }
  const fallback = new Date(d);
  fallback.setDate(d.getDate() + 1);
  return fallback;
}

exports.getDashboard = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id }).populate('classId');
  if (!student) throw new ApiError(404, 'Student profile not found');
  const classId = student.classId?._id;
  const today = new Date().getDay();

  const settings = await SchoolSettings.findOne().select('activeDays').lean();
  const nextDay = nextSchoolDay(settings?.activeDays);
  const endOfNextDay = new Date(nextDay);
  endOfNextDay.setHours(23, 59, 59, 999);

  const [todaySchedule, sessions, records, pendingHw, dueNext, unreadCount, notices] = await Promise.all([
    Timetable.find({ classId, dayOfWeek: today, isActive: true })
      .populate({
        path: 'teacherAssignmentId',
        populate: [
          { path: 'subjectId', select: 'code name nameBn' },
          { path: 'teacherId', select: 'fullName' }
        ]
      })
      .sort({ startTime: 1 }),
    AttendanceSession.find({ classId }).select('_id'),
    AttendanceRecord.find({ studentId: student._id }).select('status'),
    Homework.find({ classId, status: 'PUBLISHED', dueAt: { $gte: new Date() } })
      .sort({ dueAt: 1 }).limit(5).populate('subjectId', 'code name nameBn'),
    // Everything still open that's due by the end of the next school day.
    Homework.find({ classId, status: 'PUBLISHED', dueAt: { $gte: new Date(), $lte: endOfNextDay } })
      .sort({ dueAt: 1 })
      .populate('subjectId', 'code name nameBn')
      .populate('teacherId', 'fullName')
      .lean(),
    Notification.countDocuments({ recipientUserId: req.user._id, isRead: false }),
    // Notices meant for this student: everyone, students, their class, or them.
    Notice.find({
      isPublished: true,
      publishAt: { $lte: new Date() },
      $or: [
        { audienceType: 'ALL' },
        { audienceType: 'ROLE', audienceRoles: 'STUDENT' },
        { audienceType: 'CLASS', audienceClassIds: classId },
        { audienceType: 'USERS', audienceUserIds: req.user._id }
      ]
    }).sort({ publishAt: -1 }).limit(3)
  ]);

  const subs = await HomeworkSubmission.find({ studentId: student._id, homeworkId: { $in: dueNext.map((h) => h._id) } })
    .select('homeworkId status marks')
    .lean();
  const subMap = Object.fromEntries(subs.map((s) => [String(s.homeworkId), s]));
  const nextDayWork = dueNext.map((h) => ({ ...h, submission: subMap[String(h._id)] || { status: 'NOT_SUBMITTED' } }));

  const present = records.filter((r) => r.status === 'PRESENT').length;
  const attendancePct = sessions.length ? Math.round((present / sessions.length) * 100) : 0;

  res.json({
    success: true,
    data: {
      student,
      todaySchedule,
      attendancePercentage: attendancePct,
      totalSessions: sessions.length,
      presentCount: present,
      pendingHomework: pendingHw,
      nextSchoolDay: nextDay,
      nextDayWork,
      unreadNotifications: unreadCount,
      recentNotices: notices
    }
  });
});
