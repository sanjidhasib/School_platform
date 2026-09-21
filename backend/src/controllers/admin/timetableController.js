const Timetable = require('../../models/Timetable');
const TeacherAssignment = require('../../models/TeacherAssignment');
const { checkClassConflict, checkTeacherConflict } = require('../../services/timetableService');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.list = asyncHandler(async (req, res) => {
  const { classId, teacherId, academicSessionId } = req.query;
  const filter = { isActive: true };
  if (classId) filter.classId = classId;
  if (academicSessionId) filter.academicSessionId = academicSessionId;
  if (teacherId) {
    const assignments = await TeacherAssignment.find({ teacherId }).select('_id');
    filter.teacherAssignmentId = { $in: assignments.map(a => a._id) };
  }
  const entries = await Timetable.find(filter)
    .populate('classId', 'name section gradeNumber')
    .populate({ path: 'teacherAssignmentId', populate: [{ path: 'teacherId', select: 'fullName' }, { path: 'subjectId', select: 'name' }] })
    .sort({ dayOfWeek: 1, startTime: 1 });
  res.json({ success: true, data: entries });
});

exports.create = asyncHandler(async (req, res) => {
  const { classId, teacherAssignmentId, dayOfWeek, startTime, academicSessionId } = req.body;
  const classConflict = await checkClassConflict(classId, dayOfWeek, startTime, academicSessionId);
  if (classConflict) throw new ApiError(409, `Class already has a subject at ${startTime} on this day`);
  const assignment = await TeacherAssignment.findById(teacherAssignmentId);
  if (!assignment) throw new ApiError(404, 'Teacher assignment not found');
  const teacherConflict = await checkTeacherConflict(assignment.teacherId, dayOfWeek, startTime, academicSessionId);
  if (teacherConflict) throw new ApiError(409, `Teacher is already assigned to another class at ${startTime} on this day`);
  const entry = await Timetable.create(req.body);
  res.status(201).json({ success: true, data: entry });
});

exports.update = asyncHandler(async (req, res) => {
  const entry = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!entry) throw new ApiError(404, 'Timetable entry not found');
  res.json({ success: true, data: entry });
});

exports.remove = asyncHandler(async (req, res) => {
  await Timetable.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Entry removed' });
});
