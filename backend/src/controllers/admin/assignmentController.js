const TeacherAssignment = require('../../models/TeacherAssignment');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.list = asyncHandler(async (req, res) => {
  const { teacherId, classId, subjectId, academicSessionId } = req.query;
  const filter = {};
  if (teacherId) filter.teacherId = teacherId;
  if (classId) filter.classId = classId;
  if (subjectId) filter.subjectId = subjectId;
  if (academicSessionId) filter.academicSessionId = academicSessionId;
  const assignments = await TeacherAssignment.find(filter)
    .populate('teacherId', 'fullName teacherId')
    .populate('classId', 'name section gradeNumber')
    .populate('subjectId', 'code name nameBn')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: assignments });
});
exports.create = asyncHandler(async (req, res) => {
  const { teacherId, classId, subjectId, academicSessionId } = req.body;
  const existing = await TeacherAssignment.findOne({ teacherId, classId, subjectId, academicSessionId, isActive: true });
  if (existing) throw new ApiError(409, 'This teacher-class-subject assignment already exists');
  const assignment = await TeacherAssignment.create(req.body);
  res.status(201).json({ success: true, data: assignment });
});
exports.update = asyncHandler(async (req, res) => {
  const assignment = await TeacherAssignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!assignment) throw new ApiError(404, 'Assignment not found');
  res.json({ success: true, data: assignment });
});
exports.remove = asyncHandler(async (req, res) => {
  const assignment = await TeacherAssignment.findByIdAndDelete(req.params.id);
  if (!assignment) throw new ApiError(404, 'Assignment not found');
  res.json({ success: true, data: { _id: assignment._id } });
});
