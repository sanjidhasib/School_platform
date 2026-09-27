const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  option: { type: Number },   // MCQ
  text: { type: String },     // SHORT
  awarded: { type: Number }   // marks given: automatic for MCQ, by the teacher for SHORT
}, { _id: false });

/**
 * One student's sitting of a class test. The deadline is fixed on the server
 * when they start, so reloading the page or changing the computer's clock
 * doesn't buy extra time.
 */
const testAttemptSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassTest', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  startedAt: { type: Date, required: true },
  deadline: { type: Date, required: true },
  submittedAt: { type: Date },
  autoSubmitted: { type: Boolean, default: false },
  answers: { type: [answerSchema], default: [] },
  score: { type: Number },
  // IN_PROGRESS → SUBMITTED (short answers await marking) → GRADED
  status: { type: String, enum: ['IN_PROGRESS', 'SUBMITTED', 'GRADED'], default: 'IN_PROGRESS' }
}, { timestamps: true });

testAttemptSchema.index({ testId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
