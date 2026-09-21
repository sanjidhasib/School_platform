const { body, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  throw new ApiError(400, 'Validation failed', errors.array().map(err => err.msg));
};

const teacherValidator = [
  body('teacherId').notEmpty().withMessage('Teacher ID is required'),
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
];

module.exports = { teacherValidator };
