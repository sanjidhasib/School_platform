const mongoose = require('mongoose');
const { ATTENDANCE_SESSION_STATUS } = require('../config/constants');

const attendanceSessionSchema = new mongoose.Schema({
  timetableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Timetable' },
  teacherAssignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeacherAssignment', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  sessionDate: { type: Date, required: true },
  startTime: { type: String },
  endTime: { type: String },
  status: { type: String, enum: Object.values(ATTENDANCE_SESSION_STATUS), default: ATTENDANCE_SESSION_STATUS.OPEN },
  submittedAt: { type: Date },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
