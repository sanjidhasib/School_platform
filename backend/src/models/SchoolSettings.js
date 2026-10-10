const mongoose = require('mongoose');

const schoolSettingsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logoUrl: { type: String },
  // Homepage carousel pictures, one per slide (index = slide). An empty
  // entry means the slide keeps its built-in picture.
  carouselImages: { type: [String], default: [] },
  address: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  gradingScale: [{
    grade: String,
    minPercentage: Number,
    maxPercentage: Number,
    gradePoint: Number
  }],
  activeDays: [{ type: Number }], // 0-6
  // Exam dates: the attendance register counts "attendance before the
  // half-yearly exam" up to this day.
  halfYearlyExamDate: { type: Date },
  annualExamDate: { type: Date },
  periods: [{
    name: String,
    startTime: String,
    endTime: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('SchoolSettings', schoolSettingsSchema);
