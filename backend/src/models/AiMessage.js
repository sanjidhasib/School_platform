const mongoose = require('mongoose');

// A snapshot of where an answer came from, so the citation still reads
// correctly if the book is later replaced or re-processed.
const sourceSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'TextbookDocument' },
  documentTitle: String,
  language: String,
  chapter: String,
  pageNumber: Number,
  excerpt: String
}, { _id: false });

const aiMessageSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AiSession', required: true, index: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  sourceChunkIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TextbookChunk' }],
  sources: { type: [sourceSchema], default: [] },
  // How the answer was produced: AI = model answered from the book;
  // PASSAGES = no model available, the matching passages are shown instead;
  // GENERAL = not in the books, answered from the model's general knowledge;
  // NOT_FOUND = nothing relevant in this class's books and no model.
  mode: { type: String, enum: ['AI', 'PASSAGES', 'GENERAL', 'NOT_FOUND'], default: undefined }
}, { timestamps: true });

module.exports = mongoose.model('AiMessage', aiMessageSchema);
