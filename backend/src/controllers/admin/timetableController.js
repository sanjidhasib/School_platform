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
    .populate({ path: 'teacherAssignmentId', populate: [{ path: 'teacherId', select: 'fullName' }, { path: 'subjectId', select: 'code name nameBn' }] })
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
  const existing = await Timetable.findById(req.params.id);
  if (!existing) throw new ApiError(404, 'Timetable entry not found');

  // Editing an entry has to respect the same clashes as creating one. Without
  // this, moving a period onto an occupied slot hit the unique index and
  // surfaced as a raw database error instead of a readable message.
  const classId = req.body.classId ?? existing.classId;
  const dayOfWeek = req.body.dayOfWeek ?? existing.dayOfWeek;
  const startTime = req.body.startTime ?? existing.startTime;
  const academicSessionId = req.body.academicSessionId ?? existing.academicSessionId;
  const teacherAssignmentId = req.body.teacherAssignmentId ?? existing.teacherAssignmentId;

  const movingSlot =
    String(classId) !== String(existing.classId) ||
    dayOfWeek !== existing.dayOfWeek ||
    startTime !== existing.startTime;

  const assignment = await TeacherAssignment.findById(teacherAssignmentId);
  if (!assignment) throw new ApiError(404, 'Teacher assignment not found');

  if (movingSlot) {
    const classConflict = await checkClassConflict(classId, dayOfWeek, startTime, academicSessionId);
    if (classConflict) throw new ApiError(409, `Class already has a subject at ${startTime} on this day`);
  }

  const teacherConflict = await checkTeacherConflict(assignment.teacherId, dayOfWeek, startTime, academicSessionId);
  if (teacherConflict && String(teacherConflict._id) !== String(existing._id)) {
    throw new ApiError(409, `Teacher is already assigned to another class at ${startTime} on this day`);
  }

  const entry = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: entry });
});

exports.remove = asyncHandler(async (req, res) => {
  await Timetable.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Entry removed' });
});
