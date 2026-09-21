const mongoose = require('mongoose');

const academicSessionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "2026 Academic Year"
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isCurrent: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('AcademicSession', academicSessionSchema);
