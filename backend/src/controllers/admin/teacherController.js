const asyncHandler = require('../../utils/asyncHandler');
const Teacher = require('../../models/Teacher');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const TeacherAssignment = require('../../models/TeacherAssignment');
const { ROLES, TEACHER_STATUS } = require('../../config/constants');
const ApiError = require('../../utils/ApiError');

const getTeachers = asyncHandler(async (req, res) => {
  const teachers = await Teacher.find().populate('userId', 'username email isActive');
  res.status(200).json({ success: true, data: teachers });
});

const createTeacher = asyncHandler(async (req, res) => {
  const { teacherId, fullName, username, password, email, phone, degree, specialization, joiningDate } = req.body;

  const existingUser = await User.findOne({ username });
  if (existingUser) throw new ApiError(409, 'Username already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  
  const user = await User.create({
    username,
    email,
    passwordHash,
    role: ROLES.TEACHER
  });

  const teacher = await Teacher.create({
    userId: user._id,
    teacherId,
    fullName,
    email,
    phone,
    degree,
    specialization,
    joiningDate
  });

  res.status(201).json({ success: true, data: teacher });
});

const getTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id).populate('userId', 'username email isActive');
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  res.status(200).json({ success: true, data: teacher });
});

const updateTeacher = asyncHandler(async (req, res) => {
  // Account credentials are managed separately; never let them through this route.
  const { username, password, userId, ...updatable } = req.body;

  const teacher = await Teacher.findByIdAndUpdate(req.params.id, updatable, {
    new: true,
    runValidators: true
  }).populate('userId', 'username email isActive');
  if (!teacher) throw new ApiError(404, 'Teacher not found');

  if (updatable.email) await User.findByIdAndUpdate(teacher.userId, { email: updatable.email });

  res.status(200).json({ success: true, data: teacher });
});

const deleteTeacher = asyncHandler(async (req, res) => {
  // Deactivate rather than destroy, matching how students are removed, so that
  // historical attendance, homework and marks keep resolving their teacher.
  const teacher = await Teacher.findByIdAndUpdate(
    req.params.id,
    { status: TEACHER_STATUS.INACTIVE },
    { new: true }
  );
  if (!teacher) throw new ApiError(404, 'Teacher not found');

  await User.findByIdAndUpdate(teacher.userId, { isActive: false });
  await TeacherAssignment.updateMany({ teacherId: teacher._id }, { isActive: false });

  res.status(200).json({ success: true, message: 'Teacher deactivated' });
});

module.exports = { getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher };
