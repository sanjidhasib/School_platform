const Student = require('../models/Student');
const AiSession = require('../models/AiSession');
const AiMessage = require('../models/AiMessage');
const Subject = require('../models/Subject');
const { getAIResponse } = require('../services/aiService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.createSession = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id }).populate('classId');
  if (!student) throw new ApiError(404, 'Student not found');
  const { subjectId, preferredLanguage = 'EN' } = req.body;
  const subject = await Subject.findById(subjectId);
  if (!subject) throw new ApiError(404, 'Subject not found');
  const session = await AiSession.create({
    studentId: student._id, classNumber: student.classId.gradeNumber,
    subjectId, preferredLanguage, title: `${subject.name} Session`, startedAt: new Date(), status: 'ACTIVE'
  });
  res.status(201).json({ success: true, data: session });
});

exports.listSessions = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  const sessions = await AiSession.find({ studentId: student._id }).populate('subjectId', 'code name nameBn').sort({ startedAt: -1 }).limit(20);
  res.json({ success: true, data: sessions });
});

exports.getSession = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  const session = await AiSession.findOne({ _id: req.params.id, studentId: student._id }).populate('subjectId', 'code name nameBn');
  if (!session) throw new ApiError(404, 'Session not found');
  const messages = await AiMessage.find({ sessionId: session._id }).sort({ createdAt: 1 });
  res.json({ success: true, data: { session, messages } });
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id }).populate('classId');
  const session = await AiSession.findOne({ _id: req.params.id, studentId: student._id });
  if (!session) throw new ApiError(404, 'Session not found');
  const { content } = req.body;
  if (!content) throw new ApiError(400, 'Message content required');
  await AiMessage.create({ sessionId: session._id, role: 'USER', content, createdAt: new Date() });
  const history = await AiMessage.find({ sessionId: session._id }).sort({ createdAt: 1 }).limit(10);
  const { answer, sourceChunkIds, sources } = await getAIResponse({
    question: content, classNumber: student.classId.gradeNumber, subjectId: session.subjectId,
    language: session.preferredLanguage, history
  });
  const assistantMsg = await AiMessage.create({ sessionId: session._id, role: 'ASSISTANT', content: answer, sourceChunkIds, createdAt: new Date() });
  session.lastMessageAt = new Date(); await session.save();
  res.json({ success: true, data: { message: assistantMsg, sources } });
});
