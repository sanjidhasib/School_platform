const mongoose = require('mongoose');

const textbookChunkSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'TextbookDocument', required: true, index: true },
  classNumber: { type: Number, required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  language: { type: String, enum: ['EN', 'BN'], default: 'BN' },
  content: { type: String, required: true },
  chapter: { type: String },
  section: { type: String },
  pageNumber: { type: Number },
  // Empty when no embedding model was available at ingest time; search then
  // falls back to keyword matching for this chunk.
  embedding: { type: [Number], default: undefined, select: false }
}, { timestamps: true });

textbookChunkSchema.index({ classNumber: 1, subjectId: 1 });

module.exports = mongoose.model('TextbookChunk', textbookChunkSchema);
