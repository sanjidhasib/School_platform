const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  imageUrl: { type: String },
  achievementDate: { type: Date, required: true },
  displayOrder: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Achievement', achievementSchema);
