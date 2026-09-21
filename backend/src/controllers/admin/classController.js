const Class = require('../../models/Class');
const Student = require('../../models/Student');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.list = asyncHandler(async (req, res) => {
  const { academicSessionId } = req.query;
  const filter = {};
  if (academicSessionId) filter.academicSessionId = academicSessionId;
  const classes = await Class.find(filter).sort({ gradeNumber: 1, section: 1 });
  const withCount = await Promise.all(classes.map(async (cls) => {
    const count = await Student.countDocuments({ classId: cls._id, status: 'ACTIVE' });
    return { ...cls.toObject(), enrollmentCount: count };
  }));
  res.json({ success: true, data: withCount });
});

exports.create = asyncHandler(async (req, res) => {
  const cls = await Class.create({ ...req.body, capacity: Math.min(req.body.capacity || 40, 40) });
  res.status(201).json({ success: true, data: cls });
});

exports.update = asyncHandler(async (req, res) => {
  if (req.body.capacity) req.body.capacity = Math.min(req.body.capacity, 40);
  const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!cls) throw new ApiError(404, 'Class not found');
  res.json({ success: true, data: cls });
});
