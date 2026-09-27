/**
 * The student's full weekly routine: every period of their class, with the
 * subject, the teacher assigned to teach it, and the room.
 */
const Student = require('../../models/Student');
const Timetable = require('../../models/Timetable');
const SchoolSettings = require('../../models/SchoolSettings');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.get = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id }).populate('classId', 'name section gradeNumber');
  if (!student) throw new ApiError(404, 'Student profile not found');
  if (!student.classId) throw new ApiError(400, 'You are not in a class yet');

  const [rows, settings] = await Promise.all([
    Timetable.find({ classId: student.classId._id, isActive: true })
      .populate({
        path: 'teacherAssignmentId',
        select: 'subjectId teacherId',
        populate: [
          { path: 'subjectId', select: 'code name nameBn' },
          { path: 'teacherId', select: 'fullName' }
        ]
      })
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean(),
    SchoolSettings.findOne().select('activeDays').lean()
  ]);

  const entries = rows.map((r) => ({
    _id: r._id,
    dayOfWeek: r.dayOfWeek,
    startTime: r.startTime,
    endTime: r.endTime,
    room: r.room,
    subject: r.teacherAssignmentId?.subjectId ?? null,
    teacher: r.teacherAssignmentId?.teacherId
      ? { _id: r.teacherAssignmentId.teacherId._id, fullName: r.teacherAssignmentId.teacherId.fullName }
      : null
  }));

  // School days: from settings, else whichever days the routine uses.
  const days = settings?.activeDays?.length
    ? [...settings.activeDays].sort((a, b) => a - b)
    : [...new Set(entries.map((e) => e.dayOfWeek))].sort((a, b) => a - b);

  res.json({
    success: true,
    data: {
      class: { name: student.classId.name, section: student.classId.section, gradeNumber: student.classId.gradeNumber },
      days,
      entries
    }
  });
});
