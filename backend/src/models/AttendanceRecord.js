const mongoose = require('mongoose');
const { ATTENDANCE_STATUS } = require('../config/constants');

const attendanceRecordSchema = new mongoose.Schema({
  attendanceSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  status: { type: String, enum: Object.values(ATTENDANCE_STATUS), required: true },
  note: { type: String },
  markedAt: { type: Date, default: Date.now },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

attendanceRecordSchema.index({ attendanceSessionId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
