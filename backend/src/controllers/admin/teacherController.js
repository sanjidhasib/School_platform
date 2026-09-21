const asyncHandler = require('../../utils/asyncHandler');
const Teacher = require('../../models/Teacher');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../../config/constants');
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

module.exports = { getTeachers, createTeacher };
