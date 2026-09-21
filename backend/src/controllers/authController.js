const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateTokens, setAuthCookies, clearAuthCookies } = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.register = asyncHandler(async (req, res) => {
  const { username, email, password, role, phone } = req.body;
  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) throw new ApiError(409, 'Username or email already exists');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ username, email, passwordHash, role: role || 'STUDENT', phone });
  res.status(201).json({ success: true, data: { id: user._id, username: user.username, role: user.role } });
});

exports.login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ $or: [{ username }, { email: username }] });
  if (!user) throw new ApiError(401, 'Invalid credentials');
  if (!user.isActive) throw new ApiError(403, 'Account is deactivated');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, 'Invalid credentials');
  user.lastLoginAt = new Date(); await user.save();
  const { accessToken, refreshToken } = generateTokens(user._id);
  setAuthCookies(res, accessToken, refreshToken);
  res.json({ success: true, data: { id: user._id, username: user.username, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword } });
});

exports.logout = asyncHandler(async (req, res) => {
  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out' });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash');
  res.json({ success: true, data: user });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new ApiError(400, 'Current password is incorrect');
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.mustChangePassword = false;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully' });
});
