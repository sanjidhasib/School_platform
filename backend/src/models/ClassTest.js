const mongoose = require('mongoose');

/**
 * A timed class test a teacher sets for one of their class-subjects.
 * Multiple-choice questions mark themselves; short answers are marked by
 * the teacher afterwards.
 */
const questionSchema = new mongoose.Schema({
  kind: { type: String, enum: ['MCQ', 'SHORT'], default: 'MCQ' },
  text: { type: String, required: true, trim: true },
  options: [{ type: String, trim: true }],
  correctOption: { type: Number }, // index into options, MCQ only
  marks: { type: Number, default: 1, min: 0 }
});

const classTestSchema = new mongoose.Schema({
  teacherAssignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeacherAssignment', required: true, index: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },
  title: { type: String, required: true, trim: true },
  instructions: { type: String, default: '' },
  durationMinutes: { type: Number, required: true, min: 1, max: 300 },
  // Students can start between these times; each gets the full duration
  // from when they start, but never past closesAt.
  opensAt: { type: Date, required: true },
  closesAt: { type: Date, required: true },
  questions: { type: [questionSchema], default: [] },
  status: { type: String, enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT' },
  resultsPublished: { type: Boolean, default: false },
  // The assessment the scores were posted to, once results are published.
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' }
}, { timestamps: true });

classTestSchema.virtual('totalMarks').get(function () {
  return (this.questions || []).reduce((sum, q) => sum + (q.marks || 0), 0);
});
classTestSchema.set('toJSON', { virtuals: true });
classTestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ClassTest', classTestSchema);
