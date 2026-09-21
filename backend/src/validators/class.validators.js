const { body, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  throw new ApiError(400, 'Validation failed', errors.array().map(err => err.msg));
};

const classValidator = [
  body('name').notEmpty().withMessage('Name is required'),
  body('gradeNumber').isNumeric().withMessage('Grade number must be numeric'),
  body('section').notEmpty().withMessage('Section is required'),
  body('academicSessionId').notEmpty().withMessage('Academic Session is required'),
  validate
];

module.exports = { classValidator };
