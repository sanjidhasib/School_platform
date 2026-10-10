const Timetable = require('../../models/Timetable');
const TeacherAssignment = require('../../models/TeacherAssignment');
const Teacher = require('../../models/Teacher');
const { findClassClash, findTeacherClash, listTeacherClashes, describe } = require('../../services/timetableService');
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

/** Rejects a period that would put the class or the teacher in two places at once. */
async function assertNoClash({ classId, assignment, dayOfWeek, startTime, endTime, excludeId }) {
  if (!startTime || !endTime) throw new ApiError(400, 'Give the period a start and end time');
  if (startTime >= endTime) throw new ApiError(400, 'The period must end after it starts');
  if (String(assignment.classId) !== String(classId)) {
    throw new ApiError(400, 'That teacher and subject belong to a different class');
  }
  const classClash = await findClassClash({ classId, dayOfWeek, startTime, endTime, excludeId });
  if (classClash) throw new ApiError(409, `This class already has ${describe(classClash)}`);
  const teacherClash = await findTeacherClash({
    teacherId: assignment.teacherId,
    dayOfWeek,
    startTime,
    endTime,
    excludeIds: [excludeId]
  });
  if (teacherClash) {
    const teacher = await Teacher.findById(assignment.teacherId).select('fullName').lean();
    throw new ApiError(409, `${teacher?.fullName || 'This teacher'} is already teaching ${describe(teacherClash)}`);
  }
}

exports.create = asyncHandler(async (req, res) => {
  const { classId, teacherAssignmentId, dayOfWeek, startTime, endTime } = req.body;
  const assignment = await TeacherAssignment.findOne({ _id: teacherAssignmentId, isActive: true });
  if (!assignment) throw new ApiError(404, 'Teacher assignment not found');
  await assertNoClash({ classId, assignment, dayOfWeek, startTime, endTime });

  // A removed period keeps its row (marked inactive), and the database allows
  // one row per class, day and start time — so filling that slot again reuses it.
  const fields = { ...req.body, dayOfWeek: Number(dayOfWeek), isActive: true };
  const cleared = await Timetable.findOne({ classId, dayOfWeek: Number(dayOfWeek), startTime, isActive: false });
  const entry = cleared
    ? await Timetable.findByIdAndUpdate(cleared._id, fields, { new: true })
    : await Timetable.create(fields);
  res.status(201).json({ success: true, data: entry });
});

exports.update = asyncHandler(async (req, res) => {
  const existing = await Timetable.findById(req.params.id);
  if (!existing) throw new ApiError(404, 'Timetable entry not found');

  const classId = req.body.classId ?? existing.classId;
  const dayOfWeek = Number(req.body.dayOfWeek ?? existing.dayOfWeek);
  const startTime = req.body.startTime ?? existing.startTime;
  const endTime = req.body.endTime ?? existing.endTime;
  const teacherAssignmentId = req.body.teacherAssignmentId ?? existing.teacherAssignmentId;

  const assignment = await TeacherAssignment.findOne({ _id: teacherAssignmentId, isActive: true });
  if (!assignment) throw new ApiError(404, 'Teacher assignment not found');
  await assertNoClash({ classId, assignment, dayOfWeek, startTime, endTime, excludeId: existing._id });

  // Moving onto a slot an old, removed period still holds: clear that row first.
  if (String(classId) !== String(existing.classId) || dayOfWeek !== existing.dayOfWeek || startTime !== existing.startTime) {
    await Timetable.deleteOne({ classId, dayOfWeek, startTime, isActive: false, _id: { $ne: existing._id } });
  }
  const entry = await Timetable.findByIdAndUpdate(req.params.id, { ...req.body, dayOfWeek }, { new: true });
  res.json({ success: true, data: entry });
});

/** Teachers booked in two classes at once, for the routine page to flag. */
exports.clashes = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listTeacherClashes() });
});

exports.remove = asyncHandler(async (req, res) => {
  await Timetable.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Entry removed' });
});
