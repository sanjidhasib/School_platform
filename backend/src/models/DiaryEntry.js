const mongoose = require('mongoose');

/**
 * A line in a student's own diary: homework to do, or what to study before
 * the next class. Private to the student; they tick it off when done.
 */
const diaryEntrySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  // The diary page it belongs to, as a calendar day (YYYY-MM-DD).
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  kind: { type: String, enum: ['HOMEWORK', 'STUDY'], default: 'HOMEWORK' },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  text: { type: String, required: true, trim: true, maxlength: 500 },
  done: { type: Boolean, default: false }
}, { timestamps: true });

diaryEntrySchema.index({ studentId: 1, date: 1 });

module.exports = mongoose.model('DiaryEntry', diaryEntrySchema);
