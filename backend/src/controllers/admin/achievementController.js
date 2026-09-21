const Achievement = require('../../models/Achievement');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.list = asyncHandler(async (req, res) => {
  const achievements = await Achievement.find().sort({ displayOrder: 1, achievementDate: -1 });
  res.json({ success: true, data: achievements });
});
exports.create = asyncHandler(async (req, res) => {
  const achievement = await Achievement.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: achievement });
});
exports.update = asyncHandler(async (req, res) => {
  const achievement = await Achievement.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!achievement) throw new ApiError(404, 'Achievement not found');
  res.json({ success: true, data: achievement });
});
exports.remove = asyncHandler(async (req, res) => {
  await Achievement.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Achievement deleted' });
});
