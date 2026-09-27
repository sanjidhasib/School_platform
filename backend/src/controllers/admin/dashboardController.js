const Student = require('../../models/Student');
const Teacher = require('../../models/Teacher');
const Class = require('../../models/Class');
const Timetable = require('../../models/Timetable');
const AttendanceRecord = require('../../models/AttendanceRecord');
const AttendanceSession = require('../../models/AttendanceSession');
const Notice = require('../../models/Notice');
const asyncHandler = require('../../utils/asyncHandler');

exports.getDashboard = asyncHandler(async (req, res) => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const [totalStudents, totalTeachers, activeClasses, todayTimetable, recentNotices] = await Promise.all([
    Student.countDocuments({ status: 'ACTIVE' }),
    Teacher.countDocuments({ status: 'ACTIVE' }),
    Class.countDocuments({ isActive: true }),
    Timetable.find({ dayOfWeek, isActive: true })
      .populate('classId', 'name section gradeNumber room')
      .populate({ path: 'teacherAssignmentId', populate: [{ path: 'teacherId', select: 'fullName' }, { path: 'subjectId', select: 'code name nameBn' }] })
      .sort({ startTime: 1 }),
    // The dashboard's Notices panel read this field, but it was never sent.
    Notice.find({ isPublished: true }).select('title description eventDate publishAt createdAt').sort({ publishAt: -1 }).limit(5)
  ]);
  res.json({ success: true, data: { totalStudents, totalTeachers, activeClasses, todaySessionsCount: todayTimetable.length, todayTimetable, recentNotices } });
});
