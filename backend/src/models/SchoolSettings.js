const mongoose = require('mongoose');

const schoolSettingsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logoUrl: { type: String },
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
  periods: [{
    name: String,
    startTime: String,
    endTime: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('SchoolSettings', schoolSettingsSchema);
