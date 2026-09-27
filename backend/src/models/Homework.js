const mongoose = require('mongoose');
const { HOMEWORK_STATUS, HOMEWORK_TYPE } = require('../config/constants');

const homeworkSchema = new mongoose.Schema({
  teacherAssignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeacherAssignment', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  type: { type: String, enum: Object.values(HOMEWORK_TYPE), default: HOMEWORK_TYPE.HOMEWORK },
  title: { type: String, required: true },
  description: { type: String },
  attachmentUrl: { type: String },
  assignedAt: { type: Date, required: true },
  dueAt: { type: Date, required: true },
  maxMarks: { type: Number },
  status: { type: String, enum: Object.values(HOMEWORK_STATUS), default: HOMEWORK_STATUS.PUBLISHED }
}, { timestamps: true });

module.exports = mongoose.model('Homework', homeworkSchema);
