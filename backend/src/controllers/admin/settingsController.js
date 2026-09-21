const SchoolSettings = require('../../models/SchoolSettings');
const asyncHandler = require('../../utils/asyncHandler');

exports.get = asyncHandler(async (req, res) => {
  const settings = await SchoolSettings.findOne();
  res.json({ success: true, data: settings });
});
exports.update = asyncHandler(async (req, res) => {
  const settings = await SchoolSettings.findOneAndUpdate({}, { ...req.body, updatedAt: new Date() }, { new: true, upsert: true });
  res.json({ success: true, data: settings });
});
