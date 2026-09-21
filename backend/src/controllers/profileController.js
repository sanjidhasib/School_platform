const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Guardian = require('../models/Guardian');
const asyncHandler = require('../utils/asyncHandler');

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash');
  let profile = null;
  if (user.role === 'TEACHER') profile = await Teacher.findOne({ userId: user._id });
  if (user.role === 'STUDENT') profile = await Student.findOne({ userId: user._id }).populate('classId', 'name section');
  if (user.role === 'GUARDIAN') profile = await Guardian.findOne({ userId: user._id }).populate('studentIds', 'fullName studentId');
  res.json({ success: true, data: { user, profile } });
});
exports.updateProfile = asyncHandler(async (req, res) => {
  const { phone, email } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { phone, email }, { new: true }).select('-passwordHash');
  res.json({ success: true, data: user });
});
