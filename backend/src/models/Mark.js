const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  obtainedMarks: { type: Number },
  absent: { type: Boolean, default: false },
  remarks: { type: String },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enteredAt: { type: Date, default: Date.now }
}, { timestamps: true });

markSchema.index({ assessmentId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Mark', markSchema);
