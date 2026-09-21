const Student = require('../../models/Student');
const User = require('../../models/User');
const Class = require('../../models/Class');
const Guardian = require('../../models/Guardian');
const { checkCapacity, enrollStudent } = require('../../services/capacityService');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { paginate, paginateResponse } = require('../../utils/pagination');
const bcrypt = require('bcryptjs');

exports.list = asyncHandler(async (req, res) => {
  const { search, classId, status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (search) filter.$or = [{ fullName: new RegExp(search, 'i') }, { studentId: new RegExp(search, 'i') }];
  if (classId) filter.classId = classId;
  if (status) filter.status = status;
  const { skip, limit: lim } = paginate(null, { page, limit });
  const [students, total] = await Promise.all([
    Student.find(filter).populate('classId', 'name section gradeNumber').populate('guardianIds', 'fullName relation phone').skip(skip).limit(lim).sort({ fullName: 1 }),
    Student.countDocuments(filter)
  ]);
  res.json({ success: true, ...paginateResponse(students, total, page, lim) });
});

exports.create = asyncHandler(async (req, res) => {
  const { username, email, password, studentId, fullName, photoUrl, dateOfBirth, gender, phone, address, classId, guardianIds, admissionDate } = req.body;
  if (!username || !password || !studentId || !fullName || !classId) throw new ApiError(400, 'Required fields missing');
  const existing = await Student.findOne({ studentId });
  if (existing) throw new ApiError(409, `Student ID ${studentId} already exists`);
  const cls = await Class.findById(classId);
  if (!cls) throw new ApiError(404, 'Class not found');
  const enrolled = await Student.countDocuments({ classId, status: 'ACTIVE' });
  if (enrolled >= cls.capacity) throw new ApiError(409, `Class capacity of ${cls.capacity} has been reached`);
  const passwordHash = await bcrypt.hash(password || 'Student@123', 12);
  const user = await User.create({ username, email, passwordHash, role: 'STUDENT', phone, isActive: true });
  const student = await Student.create({ userId: user._id, studentId, fullName, photoUrl, dateOfBirth, gender, phone, address, classId, guardianIds: guardianIds || [], admissionDate, status: 'ACTIVE' });
  res.status(201).json({ success: true, data: student });
});

exports.update = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, data: student });
});

exports.remove = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, { status: 'INACTIVE' }, { new: true });
  if (!student) throw new ApiError(404, 'Student not found');
  await User.findByIdAndUpdate(student.userId, { isActive: false });
  res.json({ success: true, message: 'Student deactivated' });
});

exports.enroll = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const cls = await Class.findById(req.params.id);
  if (!cls) throw new ApiError(404, 'Class not found');
  const enrolled = await Student.countDocuments({ classId: cls._id, status: 'ACTIVE' });
  if (enrolled >= cls.capacity) throw new ApiError(409, `Class capacity of ${cls.capacity} has been reached`);
  const student = await Student.findByIdAndUpdate(studentId, { classId: cls._id }, { new: true });
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, data: student });
});

exports.getClassStudents = asyncHandler(async (req, res) => {
  const students = await Student.find({ classId: req.params.id, status: 'ACTIVE' }).sort({ fullName: 1 });
  const cls = await Class.findById(req.params.id);
  res.json({ success: true, data: students, enrollmentCount: students.length, capacity: cls?.capacity || 40 });
});
