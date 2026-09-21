const mongoose = require('mongoose');
const { ASSESSMENT_TYPE, ASSESSMENT_STATUS } = require('../config/constants');

const assessmentSchema = new mongoose.Schema({
  teacherAssignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeacherAssignment', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  academicSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
  term: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, enum: Object.values(ASSESSMENT_TYPE), required: true },
  assessmentDate: { type: Date, required: true },
  maxMarks: { type: Number, required: true },
  weight: { type: Number, required: true },
  status: { type: String, enum: Object.values(ASSESSMENT_STATUS), default: ASSESSMENT_STATUS.DRAFT }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
