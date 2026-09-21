const mongoose = require('mongoose');

const textbookDocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  classNumber: { type: Number, required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  language: { type: String, enum: ['EN', 'BN'], default: 'EN' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['PROCESSING', 'COMPLETED', 'FAILED'], default: 'PROCESSING' }
}, { timestamps: true });

module.exports = mongoose.model('TextbookDocument', textbookDocumentSchema);
