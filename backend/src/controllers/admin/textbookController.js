const TextbookDocument = require('../../models/TextbookDocument');
const TextbookChunk = require('../../models/TextbookChunk');
const asyncHandler = require('../../utils/asyncHandler');

exports.register = asyncHandler(async (req, res) => {
  const doc = await TextbookDocument.create({ ...req.body, isApproved: true });
  res.status(201).json({ success: true, data: doc });
});
exports.list = asyncHandler(async (req, res) => {
  const docs = await TextbookDocument.find().sort({ classNumber: 1 });
  res.json({ success: true, data: docs });
});
