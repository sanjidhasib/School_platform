const env = require("../config/env");
const ApiError = require("../utils/ApiError");

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || [];

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value for ${field}`;
    errors = [{ field, message }];
  }

  if (err.name === "ValidationError") {
    statusCode = 422;
    errors = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    message = "Validation failed";
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

module.exports = errorHandler;
