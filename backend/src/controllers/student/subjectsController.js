/**
 * The subjects a student's own class studies.
 *
 * The AI Learning page needs this list to start a chat. It was calling
 * GET /admin/subjects, which is admin-only, so students always got a 403 and an
 * empty subject picker - the feature could never be used.
 */
const Student = require('../../models/Student');
const Subject = require('../../models/Subject');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.list = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new ApiError(404, 'Student profile not found');

  const subjects = await Subject.find({ classIds: student.classId, isActive: true })
    .select('code name nameBn description')
    .sort({ name: 1 });

  res.json({ success: true, data: subjects });
});
