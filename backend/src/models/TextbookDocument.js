const mongoose = require('mongoose');

/**
 * One NCTB textbook PDF for one class, subject and language version.
 *
 * The file itself is what students read in the library; the extracted text
 * (TextbookChunk) is what the AI answers from. The two are independent: a
 * scanned or legacy-font PDF can still be read by students even when its text
 * can't be extracted, so `textStatus` is tracked apart from the file.
 */
const textbookDocumentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  classNumber: { type: Number, required: true, min: 1, max: 12, index: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  language: { type: String, enum: ['EN', 'BN'], default: 'BN' },
  edition: { type: String, trim: true, default: '' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Stored under UPLOAD_DIR/textbooks; never served statically — students
  // fetch it through an authenticated route that checks their class.
  fileName: { type: String },
  originalName: { type: String },
  fileSize: { type: Number, default: 0 },
  pageCount: { type: Number, default: 0 },

  status: { type: String, enum: ['PROCESSING', 'COMPLETED', 'FAILED'], default: 'PROCESSING' },
  // OK: text extracted and searchable. UNREADABLE: the PDF has no usable
  // Unicode text (scanned pages or old Bijoy/SutonnyMJ fonts) — readable by
  // students, but the AI can't answer from it until it is OCR'd or replaced.
  textStatus: { type: String, enum: ['PENDING', 'OK', 'UNREADABLE'], default: 'PENDING' },
  chunkCount: { type: Number, default: 0 },
  embeddedCount: { type: Number, default: 0 },
  errorMessage: { type: String, default: '' },
}, { timestamps: true });

textbookDocumentSchema.index({ classNumber: 1, subjectId: 1, language: 1 });

module.exports = mongoose.model('TextbookDocument', textbookDocumentSchema);
