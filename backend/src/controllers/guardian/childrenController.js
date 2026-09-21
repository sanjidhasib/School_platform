const Guardian = require('../../models/Guardian');
const Student = require('../../models/Student');
const AttendanceRecord = require('../../models/AttendanceRecord');
const AttendanceSession = require('../../models/AttendanceSession');
const Homework = require('../../models/Homework');
const HomeworkSubmission = require('../../models/HomeworkSubmission');
const Mark = require('../../models/Mark');
const SubjectGrade = require('../../models/SubjectGrade');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

const getGuardianStudent = async (guardianUserId, studentId) => {
  const guardian = await Guardian.findOne({ userId: guardianUserId });
  if (!guardian) throw new ApiError(404, 'Guardian not found');
  const isLinked = guardian.studentIds.some(id => id.toString() === studentId);
  if (!isLinked) throw new ApiError(403, 'Not authorized to view this student');
  return Student.findById(studentId).populate('classId');
};

exports.list = asyncHandler(async (req, res) => {
  const guardian = await Guardian.findOne({ userId: req.user._id });
  if (!guardian) throw new ApiError(404, 'Guardian not found');
  const children = await Student.find({ _id: { $in: guardian.studentIds } }).populate('classId', 'name section gradeNumber');
  res.json({ success: true, data: children });
});

exports.getAttendance = asyncHandler(async (req, res) => {
  const student = await getGuardianStudent(req.user._id, req.params.id);
  const sessions = await AttendanceSession.find({ classId: student.classId._id }).populate('subjectId', 'code name nameBn').sort({ sessionDate: -1 });
  const records = await AttendanceRecord.find({ studentId: student._id });
  const recordMap = Object.fromEntries(records.map(r => [r.attendanceSessionId.toString(), r]));
  const present = records.filter(r => r.status === 'PRESENT').length;
  const pct = sessions.length ? Math.round((present / sessions.length) * 100) : 0;
  res.json({ success: true, data: { attendance: sessions.map(s => ({ session: s, record: recordMap[s._id.toString()] })), summary: { total: sessions.length, present, percentage: pct } } });
});

exports.getHomework = asyncHandler(async (req, res) => {
  const student = await getGuardianStudent(req.user._id, req.params.id);
  const homeworks = await Homework.find({ classId: student.classId._id, status: 'PUBLISHED' }).populate('subjectId', 'code name nameBn').sort({ dueAt: -1 });
  const submissions = await HomeworkSubmission.find({ studentId: student._id });
  const subMap = Object.fromEntries(submissions.map(s => [s.homeworkId.toString(), s]));
  res.json({ success: true, data: homeworks.map(hw => ({ ...hw.toObject(), submission: subMap[hw._id.toString()] || { status: 'NOT_SUBMITTED' } })) });
});

exports.getResults = asyncHandler(async (req, res) => {
  const student = await getGuardianStudent(req.user._id, req.params.id);
  const marks = await Mark.find({ studentId: student._id }).populate({ path: 'assessmentId', populate: { path: 'subjectId', select: 'code name nameBn' } });
  const grades = await SubjectGrade.find({ studentId: student._id }).populate('subjectId', 'code name nameBn');
  res.json({ success: true, data: { marks, grades } });
});
