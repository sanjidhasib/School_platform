const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceSession = require('../models/AttendanceSession');
const { ATTENDANCE_SESSION_STATUS, ATTENDANCE_STATUS } = require('../config/constants');
const { notifyGuardianAbsence } = require('./notificationService');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

const submitAttendanceBatch = async (sessionId, records, userId, teacherId) => {
  const session = await AttendanceSession.findById(sessionId);
  if (!session) throw new ApiError(404, 'Attendance session not found');
  if (session.teacherId.toString() !== teacherId.toString()) throw new ApiError(403, 'Not authorized for this session');
  if (session.status !== ATTENDANCE_SESSION_STATUS.OPEN) throw new ApiError(400, 'Session is not open');

  const operations = records.map(record => ({
    updateOne: {
      filter: { attendanceSessionId: sessionId, studentId: record.studentId },
      update: {
        $set: {
          status: record.status,
          note: record.note,
          markedBy: userId
        }
      },
      upsert: true
    }
  }));

  await AttendanceRecord.bulkWrite(operations);

  session.status = ATTENDANCE_SESSION_STATUS.SUBMITTED;
  session.submittedAt = new Date();
  session.submittedBy = userId;
  await session.save();

  // Notify guardians for absences
  const absentRecords = records.filter(r => r.status === ATTENDANCE_STATUS.ABSENT);
  for (const record of absentRecords) {
    await notifyGuardianAbsence(record.studentId, sessionId);
  }

  return session;
};

module.exports = { submitAttendanceBatch };
