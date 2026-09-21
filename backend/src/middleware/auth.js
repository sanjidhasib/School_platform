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

const protect = async (req, res, next) => {
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

module.exports = { protect, verifyToken: protect, optionalAuth, getTokenFromRequest };
