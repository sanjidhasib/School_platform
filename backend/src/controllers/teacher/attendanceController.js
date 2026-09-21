const Teacher = require('../../models/Teacher');
const Student = require('../../models/Student');
const AttendanceSession = require('../../models/AttendanceSession');
const AttendanceRecord = require('../../models/AttendanceRecord');
const { notifyGuardianAbsence } = require('../../services/notificationService');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.createSession = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new ApiError(404, 'Teacher profile not found');
  const session = await AttendanceSession.create({ ...req.body, teacherId: teacher._id, status: 'OPEN' });
  res.status(201).json({ success: true, data: session });
});

exports.getSession = asyncHandler(async (req, res) => {
  const session = await AttendanceSession.findById(req.params.sessionId)
    .populate('classId', 'name section')
    .populate('subjectId', 'code name nameBn');
  if (!session) throw new ApiError(404, 'Session not found');
  const students = await Student.find({ classId: session.classId, status: 'ACTIVE' }).sort({ fullName: 1 });
  const records = await AttendanceRecord.find({ attendanceSessionId: session._id });
  const recordMap = Object.fromEntries(records.map(r => [r.studentId.toString(), r]));
  res.json({ success: true, data: { session, students, records: recordMap } });
});

exports.saveAttendance = asyncHandler(async (req, res) => {
  const { records } = req.body; // [{studentId, status, note}]
  const session = await AttendanceSession.findById(req.params.sessionId);
  if (!session) throw new ApiError(404, 'Session not found');
  if (session.status === 'LOCKED') throw new ApiError(403, 'Attendance session is locked');
  const ops = records.map(r => ({
    updateOne: {
      filter: { attendanceSessionId: session._id, studentId: r.studentId },
      update: { $set: { status: r.status, note: r.note, markedBy: req.user._id, markedAt: new Date(), updatedAt: new Date(), updatedBy: req.user._id } },
      upsert: true
    }
  }));
  await AttendanceRecord.bulkWrite(ops);
  session.status = 'SUBMITTED'; session.submittedAt = new Date(); session.submittedBy = req.user._id;
  await session.save();
  // Notify guardians of absent students
  const absentRecords = records.filter(r => r.status === 'ABSENT');
  for (const r of absentRecords) {
    notifyGuardianAbsence(r.studentId, session).catch(console.error);
  }
  res.json({ success: true, message: 'Attendance saved', data: { submitted: records.length } });
});

exports.getHistory = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  const sessions = await AttendanceSession.find({ teacherId: teacher._id })
    .populate('classId', 'name section')
    .populate('subjectId', 'code name nameBn')
    .sort({ sessionDate: -1 }).limit(50);
  res.json({ success: true, data: sessions });
});
