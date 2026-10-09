const Student = require('../../models/Student');
const Subject = require('../../models/Subject');
const DiaryEntry = require('../../models/DiaryEntry');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

const DAY = /^\d{4}-\d{2}-\d{2}$/;

async function currentStudent(req) {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new ApiError(404, 'Student profile not found');
  return student;
}

/** One diary page: ?date=YYYY-MM-DD */
exports.list = asyncHandler(async (req, res) => {
  const student = await currentStudent(req);
  const date = String(req.query.date || '');
  if (!DAY.test(date)) throw new ApiError(400, 'Choose a day');
  const entries = await DiaryEntry.find({ studentId: student._id, date })
    .populate('subjectId', 'code name nameBn')
    .sort({ createdAt: 1 });
  res.json({ success: true, data: entries });
});

exports.create = asyncHandler(async (req, res) => {
  const student = await currentStudent(req);
  const { date, kind, subjectId } = req.body;
  const text = String(req.body.text || '').trim();
  if (!DAY.test(String(date || ''))) throw new ApiError(400, 'Choose a day');
  if (!text) throw new ApiError(400, 'Write something first');
  if (text.length > 500) throw new ApiError(400, 'Keep it under 500 characters');
  if (subjectId && !(await Subject.exists({ _id: subjectId, classIds: student.classId }))) {
    throw new ApiError(400, 'That subject is not taught in your class');
  }
  const entry = await DiaryEntry.create({
    studentId: student._id,
    date,
    kind: kind === 'STUDY' ? 'STUDY' : 'HOMEWORK',
    subjectId: subjectId || undefined,
    text
  });
  await entry.populate('subjectId', 'code name nameBn');
  res.status(201).json({ success: true, data: entry });
});

exports.update = asyncHandler(async (req, res) => {
  const student = await currentStudent(req);
  const entry = await DiaryEntry.findOne({ _id: req.params.id, studentId: student._id });
  if (!entry) throw new ApiError(404, 'Diary entry not found');
  if (typeof req.body.done === 'boolean') entry.done = req.body.done;
  if (typeof req.body.text === 'string' && req.body.text.trim()) entry.text = req.body.text.trim().slice(0, 500);
  await entry.save();
  await entry.populate('subjectId', 'code name nameBn');
  res.json({ success: true, data: entry });
});

exports.remove = asyncHandler(async (req, res) => {
  const student = await currentStudent(req);
  const entry = await DiaryEntry.findOneAndDelete({ _id: req.params.id, studentId: student._id });
  if (!entry) throw new ApiError(404, 'Diary entry not found');
  res.json({ success: true, data: { _id: entry._id } });
});
