const fs = require('fs');
const path = require('path');
const TextbookDocument = require('../../models/TextbookDocument');
const TextbookChunk = require('../../models/TextbookChunk');
const Subject = require('../../models/Subject');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { enqueue, textbookDir } = require('../../services/textbookIngest');
const provider = require('../../services/aiProvider');

const removeFile = (fileName) => {
  if (!fileName) return;
  fs.promises.unlink(path.join(textbookDir, fileName)).catch(() => {});
};

// Every PDF starts with "%PDF-". A renamed .exe or HTML page doesn't.
function isRealPdf(filePath) {
  const fd = fs.openSync(filePath, 'r');
  const head = Buffer.alloc(5);
  fs.readSync(fd, head, 0, 5, 0);
  fs.closeSync(fd);
  return head.toString('latin1') === '%PDF-';
}

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.classNumber) filter.classNumber = Number(req.query.classNumber);
  const docs = await TextbookDocument.find(filter)
    .populate('subjectId', 'code name nameBn')
    .populate('uploadedBy', 'username email')
    .sort({ classNumber: 1, createdAt: -1 });
  res.json({ success: true, data: docs, ai: provider.status() });
});

exports.upload = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Choose a PDF to upload');

  try {
    if (!isRealPdf(req.file.path)) throw new ApiError(400, 'That file is not a valid PDF');

    const classNumber = Number(req.body.classNumber);
    if (!Number.isInteger(classNumber) || classNumber < 1 || classNumber > 12) {
      throw new ApiError(400, 'Choose a class');
    }
    const language = req.body.language === 'EN' ? 'EN' : 'BN';
    const subject = await Subject.findById(req.body.subjectId);
    if (!subject) throw new ApiError(400, 'Choose a subject');

    const versionLabel = language === 'BN' ? 'Bangla version' : 'English version';
    const title = String(req.body.title || '').trim() || `${subject.name} — Class ${classNumber} (${versionLabel})`;

    const doc = await TextbookDocument.create({
      title,
      classNumber,
      subjectId: subject._id,
      language,
      edition: String(req.body.edition || '').trim(),
      uploadedBy: req.user._id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size
    });

    enqueue(doc._id);
    await doc.populate('subjectId', 'code name nameBn');
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    removeFile(req.file.filename);
    throw err;
  }
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await TextbookDocument.findById(req.params.id);
  if (!doc) throw new ApiError(404, 'Textbook not found');
  if (typeof req.body.title === 'string' && req.body.title.trim()) doc.title = req.body.title.trim();
  if (typeof req.body.edition === 'string') doc.edition = req.body.edition.trim();
  await doc.save();
  await doc.populate('subjectId', 'code name nameBn');
  res.json({ success: true, data: doc });
});

exports.reprocess = asyncHandler(async (req, res) => {
  const doc = await TextbookDocument.findById(req.params.id);
  if (!doc) throw new ApiError(404, 'Textbook not found');
  if (!doc.fileName) throw new ApiError(400, 'This entry has no PDF attached');
  doc.status = 'PROCESSING';
  doc.textStatus = 'PENDING';
  doc.errorMessage = '';
  await doc.save();
  enqueue(doc._id);
  res.json({ success: true, data: doc });
});

exports.remove = asyncHandler(async (req, res) => {
  const doc = await TextbookDocument.findByIdAndDelete(req.params.id);
  if (!doc) throw new ApiError(404, 'Textbook not found');
  await TextbookChunk.deleteMany({ documentId: doc._id });
  removeFile(doc.fileName);
  res.json({ success: true, message: 'Textbook deleted' });
});

exports.file = asyncHandler(async (req, res) => {
  const doc = await TextbookDocument.findById(req.params.id);
  if (!doc?.fileName) throw new ApiError(404, 'Textbook not found');
  sendPdf(res, doc);
});

/** Shared with the student route. Express handles Range requests, so the
 *  reader can load a large book page by page instead of all at once. */
function sendPdf(res, doc) {
  const filePath = path.join(textbookDir, doc.fileName);
  if (!fs.existsSync(filePath)) throw new ApiError(404, 'The PDF file is missing — upload it again');
  const safeName = (doc.originalName || `${doc.title}.pdf`).replace(/[^\w.\- ]+/g, '_');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  // A reader closing mid-download is normal, not an error worth a 500.
  res.sendFile(filePath, (err) => {
    if (err && !res.headersSent) res.status(err.status || 500).end();
  });
}

exports.sendPdf = sendPdf;
