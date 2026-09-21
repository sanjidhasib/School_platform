const ApiError = require("../utils/ApiError");

/**
 * Restrict access to one or more roles. Must run AFTER `protect`.
 * Exported as both `requireRole` (used by route files) and `authorize` (alias).
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, "Authentication required"));
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden: insufficient role"));
    }
    next();
  };
};

module.exports = requireRole;
module.exports.requireRole = requireRole;
module.exports.authorize = requireRole;
module.exports.default = requireRole;
