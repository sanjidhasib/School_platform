const Student = require('../../models/Student');
const Teacher = require('../../models/Teacher');
const Class = require('../../models/Class');
const Timetable = require('../../models/Timetable');
const AttendanceRecord = require('../../models/AttendanceRecord');
const AttendanceSession = require('../../models/AttendanceSession');
const asyncHandler = require('../../utils/asyncHandler');

exports.getDashboard = asyncHandler(async (req, res) => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const [totalStudents, totalTeachers, activeClasses, todayTimetable] = await Promise.all([
    Student.countDocuments({ status: 'ACTIVE' }),
    Teacher.countDocuments({ status: 'ACTIVE' }),
    Class.countDocuments({ isActive: true }),
    Timetable.find({ dayOfWeek, isActive: true })
      .populate('classId', 'name section')
      .populate({ path: 'teacherAssignmentId', populate: [{ path: 'teacherId', select: 'fullName' }, { path: 'subjectId', select: 'name' }] })
      .sort({ startTime: 1 })
  ]);
  res.json({ success: true, data: { totalStudents, totalTeachers, activeClasses, todaySessionsCount: todayTimetable.length, todayTimetable } });
});
