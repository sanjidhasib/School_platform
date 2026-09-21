const { body, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = errors.array().map(err => err.msg);
  throw new ApiError(400, 'Validation failed', extractedErrors);
};

const loginValidator = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

const changePasswordValidator = [
  body('oldPassword').notEmpty().withMessage('Old password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validate
];

module.exports = { loginValidator, changePasswordValidator };
