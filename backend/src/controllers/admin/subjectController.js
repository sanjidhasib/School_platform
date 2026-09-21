const Subject = require('../../models/Subject');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.list = asyncHandler(async (req, res) => {
  const { classId } = req.query;
  const filter = {};
  if (classId) filter.classIds = classId;
  const subjects = await Subject.find(filter).sort({ name: 1 });
  res.json({ success: true, data: subjects });
});
exports.create = asyncHandler(async (req, res) => {
  const subject = await Subject.create(req.body);
  res.status(201).json({ success: true, data: subject });
});
exports.update = asyncHandler(async (req, res) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!subject) throw new ApiError(404, 'Subject not found');
  res.json({ success: true, data: subject });
});
exports.remove = asyncHandler(async (req, res) => {
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) throw new ApiError(404, 'Subject not found');
  res.json({ success: true, data: { _id: subject._id } });
});
