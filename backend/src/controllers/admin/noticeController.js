const Notice = require('../../models/Notice');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.list = asyncHandler(async (req, res) => {
  const notices = await Notice.find().sort({ createdAt: -1 }).populate('authorUserId', 'username');
  res.json({ success: true, data: notices });
});
exports.create = asyncHandler(async (req, res) => {
  const notice = await Notice.create({ ...req.body, authorUserId: req.user._id });
  res.status(201).json({ success: true, data: notice });
});
exports.update = asyncHandler(async (req, res) => {
  const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!notice) throw new ApiError(404, 'Notice not found');
  res.json({ success: true, data: notice });
});
exports.remove = asyncHandler(async (req, res) => {
  await Notice.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Notice deleted' });
});
