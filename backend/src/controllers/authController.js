const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
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

/**
 * Silently renews the 15-minute access token from the 7-day refresh token.
 *
 * The refresh token cookie was always issued at login and the frontend's
 * anonymous-401 allowlist already named this route, but the route itself was
 * never implemented. Without it, every session died after 15 minutes: the
 * access token cookie expired, the browser stopped sending it, and every
 * subsequent API call came back 401 - which pages quietly rendered as an
 * empty list rather than a login redirect, so it looked like the data had
 * simply vanished.
 */
exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'No refresh token');

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    clearAuthCookies(res);
    throw new ApiError(401, err.name === 'TokenExpiredError' ? 'Session expired' : 'Invalid refresh token');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    clearAuthCookies(res);
    throw new ApiError(401, 'User not found or disabled');
  }

  const { accessToken, refreshToken } = generateTokens(user._id);
  setAuthCookies(res, accessToken, refreshToken);
  res.json({ success: true, data: { id: user._id, username: user.username, role: user.role } });
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

/**
 * "Who is signed in?" for the app's startup check. Always answers 200, with
 * the user or null — a signed-out visitor to the public homepage is a normal
 * state, not an error, and shouldn't put two failed requests in the console
 * (/auth/me 401, then a refresh attempt 401). If the access token has
 * lapsed but the refresh token is still good, the session is renewed here in
 * the same call.
 */
exports.session = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken } = req.cookies || {};
  let userId = null;

  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, env.JWT_SECRET);
      userId = decoded.id || decoded.userId;
    } catch {
      // expired or invalid — fall through to the refresh token
    }
  }

  if (!userId && refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_SECRET);
      const candidate = await User.findById(decoded.id).select('isActive');
      if (candidate?.isActive) {
        const tokens = generateTokens(candidate._id);
        setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
        userId = candidate._id;
      } else {
        clearAuthCookies(res);
      }
    } catch {
      clearAuthCookies(res);
    }
  }

  const user = userId ? await User.findById(userId).select('-passwordHash') : null;
  res.json({ success: true, data: user && user.isActive ? user : null });
});
