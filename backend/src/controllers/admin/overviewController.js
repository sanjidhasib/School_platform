/**
 * Read-only, school-wide views for the admin office.
 *
 * The teacher-facing controllers are all scoped to the signed-in teacher, so an
 * administrator had no way to look across the whole school. These endpoints add
 * that view and nothing else: they never create, update or delete.
 */
const AttendanceSession = require('../../models/AttendanceSession');
const AttendanceRecord = require('../../models/AttendanceRecord');
const Homework = require('../../models/Homework');
const HomeworkSubmission = require('../../models/HomeworkSubmission');
const Assessment = require('../../models/Assessment');
const SubjectGrade = require('../../models/SubjectGrade');
const Notification = require('../../models/Notification');
const asyncHandler = require('../../utils/asyncHandler');

const dayRange = (value) => {
  const start = value ? new Date(value) : new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { $gte: start, $lt: end };
};

exports.listAttendance = asyncHandler(async (req, res) => {
  const { classId, date } = req.query;
  const filter = { sessionDate: dayRange(date) };
  if (classId) filter.classId = classId;

  const sessions = await AttendanceSession.find(filter)
    .populate('classId', 'name section')
    .populate('subjectId', 'name nameBn')
    .populate('teacherId', 'fullName')
    .sort({ startTime: 1 });

  const counts = await AttendanceRecord.aggregate([
    { $match: { attendanceSessionId: { $in: sessions.map((s) => s._id) } } },
    { $group: { _id: { session: '$attendanceSessionId', status: '$status' }, count: { $sum: 1 } } }
  ]);

  const bySession = {};
  counts.forEach((c) => {
    const key = String(c._id.session);
    bySession[key] = bySession[key] || { PRESENT: 0, ABSENT: 0, LEAVE: 0 };
    bySession[key][c._id.status] = c.count;
  });

  res.json({
    success: true,
    data: sessions.map((s) => ({ session: s, counts: bySession[String(s._id)] || { PRESENT: 0, ABSENT: 0, LEAVE: 0 } }))
  });
});

exports.listHomework = asyncHandler(async (req, res) => {
  const { classId, status } = req.query;
  const filter = {};
  if (classId) filter.classId = classId;
  if (status) filter.status = status;

  const homework = await Homework.find(filter)
    .populate('classId', 'name section')
    .populate('subjectId', 'name nameBn')
    .populate('teacherId', 'fullName')
    .sort({ dueAt: -1 })
    .limit(200);

  const submissions = await HomeworkSubmission.aggregate([
    { $match: { homeworkId: { $in: homework.map((h) => h._id) } } },
    { $group: { _id: { homework: '$homeworkId', status: '$status' }, count: { $sum: 1 } } }
  ]);

  const byHomework = {};
  submissions.forEach((s) => {
    const key = String(s._id.homework);
    byHomework[key] = byHomework[key] || {};
    byHomework[key][s._id.status] = s.count;
  });

  res.json({
    success: true,
    data: homework.map((h) => ({ homework: h, submissionCounts: byHomework[String(h._id)] || {} }))
  });
});

exports.listResults = asyncHandler(async (req, res) => {
  const { classId, term } = req.query;
  const assessmentFilter = {};
  const gradeFilter = {};
  if (classId) { assessmentFilter.classId = classId; gradeFilter.classId = classId; }
  if (term) { assessmentFilter.term = term; gradeFilter.term = term; }

  const [assessments, grades] = await Promise.all([
    Assessment.find(assessmentFilter)
      .populate('classId', 'name section')
      .populate('subjectId', 'name nameBn')
      .populate('teacherId', 'fullName')
      .sort({ assessmentDate: -1 })
      .limit(200),
    SubjectGrade.find(gradeFilter)
      .populate('classId', 'name section')
      .populate('subjectId', 'name nameBn')
      .populate('studentId', 'fullName studentId')
      .sort({ createdAt: -1 })
      .limit(500)
  ]);

  res.json({ success: true, data: { assessments, grades } });
});

exports.listNotifications = asyncHandler(async (req, res) => {
  const { type, unreadOnly } = req.query;
  const filter = { recipientUserId: req.user._id };
  if (type) filter.type = type;
  if (unreadOnly === 'true') filter.isRead = false;

  const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(100);
  const unreadCount = await Notification.countDocuments({ recipientUserId: req.user._id, isRead: false });

  res.json({ success: true, data: notifications, unreadCount });
});
