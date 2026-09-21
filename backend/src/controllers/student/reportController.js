const Student = require('../../models/Student');
const { generateReport } = require('../../services/reportService');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.download = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new ApiError(404, 'Student not found');
  const pdf = await generateReport(student._id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=report-${student.studentId}.pdf`);
  res.send(pdf);
});
