const { body, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  throw new ApiError(400, 'Validation failed', errors.array().map(e => e.msg));
};

const subjectValidator = [body('name').notEmpty(), validate];
const assignmentValidator = [body('teacherId').notEmpty(), validate];
const timetableValidator = [body('dayOfWeek').isNumeric(), validate];
const homeworkValidator = [body('title').notEmpty(), validate];
const assessmentValidator = [body('title').notEmpty(), validate];
const noticeValidator = [body('title').notEmpty(), validate];
const achievementValidator = [body('title').notEmpty(), validate];

module.exports = {
  subjectValidator, assignmentValidator, timetableValidator,
  homeworkValidator, assessmentValidator, noticeValidator, achievementValidator
};
