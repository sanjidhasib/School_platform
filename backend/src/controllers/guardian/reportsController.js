const Guardian = require('../../models/Guardian');
const Student = require('../../models/Student');
const { generateReport } = require('../../services/reportService');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.download = asyncHandler(async (req, res) => {
  const guardian = await Guardian.findOne({ userId: req.user._id });
  if (!guardian) throw new ApiError(404, 'Guardian not found');
  const isLinked = guardian.studentIds.some(id => id.toString() === req.params.id);
  if (!isLinked) throw new ApiError(403, 'Not authorized');
  const student = await Student.findById(req.params.id);
  const pdf = await generateReport(student._id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=report-${student.studentId}.pdf`);
  res.send(pdf);
});
