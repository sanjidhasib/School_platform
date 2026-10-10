const jwt = require("jsonwebtoken");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");

const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    throw err;
  }
};

const getTokenFromRequest = (req) => {
  let token = null;
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) token = auth.slice(7);
  if (!token && req.cookies) token = req.cookies.accessToken || req.cookies.token;
  return token;
};

/**
 * Textbook PDFs are too big for the website's forwarder, so the browser sends
 * them straight to this server with a 10-minute upload token. It is signed
 * with its own key, so it can't pass `protect`, refresh or session anywhere
 * else - only routes that put this middleware first accept it.
 */
const UPLOAD_PURPOSE = 'textbook-upload';
const uploadSecret = () => `${env.JWT_SECRET}:${UPLOAD_PURPOSE}`;
const signUploadToken = (userId) =>
  jwt.sign({ id: userId, purpose: UPLOAD_PURPOSE }, uploadSecret(), { expiresIn: '10m' });

const acceptUploadToken = async (req, res, next) => {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return next();
  let decoded;
  try {
    decoded = jwt.verify(auth.slice(7), uploadSecret());
  } catch {
    return next(); // not an upload token - let `protect` judge it
  }
  if (decoded.purpose !== UPLOAD_PURPOSE) return next();
  const user = await User.findById(decoded.id).select("-passwordHash");
  if (!user || !user.isActive) return next(new ApiError(401, "User not found"));
  req.user = user;
  req.userId = user._id;
  req.uploadAuthed = true;
  next();
};

const protect = async (req, res, next) => {
  if (req.uploadAuthed) return next();
  const token = getTokenFromRequest(req);
  if (!token) return next(new ApiError(401, "Authentication required"));

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id || decoded.userId).select("-passwordHash");
    if (!user) return next(new ApiError(401, "User not found"));
    if (!user.isActive) return next(new ApiError(403, "Account disabled"));

    req.user = user;
    req.userId = user._id;
    next();
  } catch (err) {
    return next(new ApiError(401, err.name === "TokenExpiredError" ? "Token expired" : "Invalid token"));
  }
};

const optionalAuth = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) return next();
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id || decoded.userId).select("-passwordHash");
    if (user && user.isActive) {
      req.user = user;
      req.userId = user._id;
    }
  } catch (_) {
    // ignore - treat as anonymous
  }
  next();
};

module.exports = { protect, verifyToken: protect, optionalAuth, getTokenFromRequest, acceptUploadToken, signUploadToken };
