const mongoose = require('mongoose');

const aiMessageSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AiSession', required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  sourceChunkIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TextbookChunk' }]
}, { timestamps: true });

module.exports = mongoose.model('AiMessage', aiMessageSchema);
