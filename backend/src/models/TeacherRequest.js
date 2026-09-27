const mongoose = require('mongoose');

/**
 * The office asking a teacher to submit something for one of their
 * class-subjects: final grades for a term, or the attendance register.
 * Grade requests close themselves when the teacher submits final grades;
 * attendance requests are marked done by the teacher.
 */
const teacherRequestSchema = new mongoose.Schema({
  type: { type: String, enum: ['GRADES', 'ATTENDANCE'], required: true },
  teacherAssignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeacherAssignment', required: true, index: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  term: { type: String, enum: ['TERM_1', 'TERM_2', 'FINAL'] },
  // Attendance up to this day (e.g. the day before the half-yearly exam).
  upTo: { type: Date },
  dueDate: { type: Date },
  message: { type: String, default: '' },
  status: { type: String, enum: ['OPEN', 'DONE', 'CANCELLED'], default: 'OPEN', index: true },
  completedAt: { type: Date },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('TeacherRequest', teacherRequestSchema);
