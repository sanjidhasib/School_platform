const mongoose = require('mongoose');

const textbookChunkSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'TextbookDocument', required: true },
  classNumber: { type: Number, required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  content: { type: String, required: true },
  chapter: { type: String },
  section: { type: String },
  pageNumber: { type: Number },
  embedding: { type: [Number] }
}, { timestamps: true });

textbookChunkSchema.index({ classNumber: 1, subjectId: 1 });

module.exports = mongoose.model('TextbookChunk', textbookChunkSchema);
