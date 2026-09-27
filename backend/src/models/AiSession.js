const mongoose = require('mongoose');

const aiSessionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  // Taken from the student's own class when the chat starts, never from the
  // request — answers stay at the level of the book the student actually has.
  classNumber: { type: Number, required: true },
  preferredLanguage: { type: String, enum: ['EN', 'BN'], default: 'BN' },
  title: { type: String },
  isActive: { type: Boolean, default: true },
  startedAt: { type: Date, default: Date.now },
  lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('AiSession', aiSessionSchema);
