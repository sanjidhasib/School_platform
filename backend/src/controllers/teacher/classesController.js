/**
 * Lets a teacher read the roster of a class they actually teach.
 *
 * Until now the only way to see a class list was to open an attendance session,
 * which made marks entry impossible without side effects. Access is restricted
 * to classes the teacher holds an active assignment for.
 */
const Teacher = require('../../models/Teacher');
const TeacherAssignment = require('../../models/TeacherAssignment');
const Student = require('../../models/Student');
const Class = require('../../models/Class');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.getClassStudents = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new ApiError(404, 'Teacher profile not found');

  const teaches = await TeacherAssignment.exists({
    teacherId: teacher._id,
    classId: req.params.classId,
    isActive: true
  });
  if (!teaches) throw new ApiError(403, 'You are not assigned to this class');

  const [students, cls] = await Promise.all([
    Student.find({ classId: req.params.classId, status: 'ACTIVE' })
      .select('fullName studentId rollNumber photoUrl')
      .sort({ fullName: 1 }),
    Class.findById(req.params.classId).select('name section capacity room')
  ]);

  res.json({ success: true, data: students, class: cls, enrollmentCount: students.length });
});

/**
 * The classes and subjects this teacher is assigned to.
 *
 * The homework and results screens need this to know what a teacher may set
 * work for. They were calling GET /admin/assignments, which is admin-only, so
 * teachers always got a 403 and an empty picker.
 */
exports.listAssignments = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new ApiError(404, 'Teacher profile not found');

  const assignments = await TeacherAssignment.find({ teacherId: teacher._id, isActive: true })
    .populate('classId', 'name section gradeNumber room')
    .populate('subjectId', 'code name nameBn')
    .sort({ createdAt: 1 });

  res.json({ success: true, data: assignments });
});
