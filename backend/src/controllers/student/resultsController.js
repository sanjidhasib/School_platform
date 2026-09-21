const Student = require('../../models/Student');
const Mark = require('../../models/Mark');
const Assessment = require('../../models/Assessment');
const SubjectGrade = require('../../models/SubjectGrade');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.getResults = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new ApiError(404, 'Student not found');
  const marks = await Mark.find({ studentId: student._id }).populate({ path: 'assessmentId', populate: { path: 'subjectId', select: 'code name nameBn' } });
  const grades = await SubjectGrade.find({ studentId: student._id }).populate('subjectId', 'code name nameBn');
  res.json({ success: true, data: { marks, grades } });
});
