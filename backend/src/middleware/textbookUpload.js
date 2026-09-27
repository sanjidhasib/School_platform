/**
 * Uploads for NCTB textbook PDFs. Separate from the general upload middleware
 * because the rules differ: PDFs only, a much larger size limit (full NCTB
 * books run 10–80 MB), and a private folder instead of the public /uploads.
 */
const multer = require('multer');
const path = require('path');
const env = require('../config/env');
const { textbookDir } = require('../services/textbookIngest');
const ApiError = require('../utils/ApiError');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, textbookDir),
  filename: (req, file, cb) => cb(null, `book-${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`)
});

const textbookUpload = multer({
  storage,
  limits: { fileSize: Number(env.TEXTBOOK_MAX_MB) * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const isPdf = path.extname(file.originalname).toLowerCase() === '.pdf' && /pdf/i.test(file.mimetype);
    if (isPdf) return cb(null, true);
    cb(new ApiError(400, 'Only PDF files can be uploaded as textbooks'));
  }
});

module.exports = { textbookUpload };
