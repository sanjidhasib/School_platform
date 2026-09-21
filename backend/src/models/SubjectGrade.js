const mongoose = require('mongoose');
const { SUBJECT_GRADE_STATUS } = require('../config/constants');

const subjectGradeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacherAssignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeacherAssignment', required: true },
  academicSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
  term: { type: String, required: true },
  percentage: { type: Number, required: true },
  grade: { type: String, required: true },
  gradePoint: { type: Number, required: true },
  remarks: { type: String },
  status: { type: String, enum: Object.values(SUBJECT_GRADE_STATUS), default: SUBJECT_GRADE_STATUS.DRAFT },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedAt: { type: Date, default: Date.now }
}, { timestamps: true });

subjectGradeSchema.index({ studentId: 1, subjectId: 1, academicSessionId: 1, term: 1 }, { unique: true });

module.exports = mongoose.model('SubjectGrade', subjectGradeSchema);
