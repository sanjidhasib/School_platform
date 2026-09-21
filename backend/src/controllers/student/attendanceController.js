const Student = require('../../models/Student');
const AttendanceRecord = require('../../models/AttendanceRecord');
const AttendanceSession = require('../../models/AttendanceSession');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.getAttendance = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new ApiError(404, 'Student not found');
  const { subjectId, from, to } = req.query;
  const sessionFilter = { classId: student.classId };
  if (from || to) { sessionFilter.sessionDate = {}; if (from) sessionFilter.sessionDate.$gte = new Date(from); if (to) sessionFilter.sessionDate.$lte = new Date(to); }
  const sessions = await AttendanceSession.find(sessionFilter).populate('subjectId', 'code name nameBn').sort({ sessionDate: -1 });
  const records = await AttendanceRecord.find({ studentId: student._id, attendanceSessionId: { $in: sessions.map(s => s._id) } });
  const recordMap = Object.fromEntries(records.map(r => [r.attendanceSessionId.toString(), r]));
  const combined = sessions.map(s => ({ session: s, record: recordMap[s._id.toString()] }));
  const present = records.filter(r => r.status === 'PRESENT').length;
  const pct = sessions.length ? Math.round((present / sessions.length) * 100) : 0;
  res.json({ success: true, data: { attendance: combined, summary: { total: sessions.length, present, absent: records.filter(r => r.status === 'ABSENT').length, leave: records.filter(r => r.status === 'LEAVE').length, percentage: pct } } });
});
