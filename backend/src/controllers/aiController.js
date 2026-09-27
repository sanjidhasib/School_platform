const Student = require('../models/Student');
const AiSession = require('../models/AiSession');
const AiMessage = require('../models/AiMessage');
const Subject = require('../models/Subject');
const TextbookDocument = require('../models/TextbookDocument');
const { answerQuestion } = require('../services/aiService');
const provider = require('../services/aiProvider');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const MAX_QUESTION = 2000;

async function currentStudent(req) {
  const student = await Student.findOne({ userId: req.user._id }).populate('classId', 'name section gradeNumber');
  if (!student) throw new ApiError(404, 'Student profile not found');
  if (!student.classId?.gradeNumber) throw new ApiError(400, 'You are not in a class yet. Ask the school office to admit you to one.');
  return student;
}

/**
 * What the AI page needs before the first chat: the student's class, their
 * subjects, and which of those subjects have a textbook the AI can answer
 * from — so the page can say so up front instead of after a failed question.
 */
exports.context = asyncHandler(async (req, res) => {
  const student = await currentStudent(req);
  const classNumber = student.classId.gradeNumber;

  const [subjects, books] = await Promise.all([
    Subject.find({ classIds: student.classId._id, isActive: true }).select('code name nameBn').sort({ name: 1 }).lean(),
    TextbookDocument.find({ classNumber }).select('subjectId language status textStatus').lean()
  ]);

  const data = subjects.map((s) => {
    const own = books.filter((b) => String(b.subjectId) === String(s._id));
    return {
      ...s,
      books: own.length,
      aiReady: own.some((b) => b.status === 'COMPLETED' && b.textStatus === 'OK'),
      languages: [...new Set(own.map((b) => b.language))]
    };
  });

  res.json({
    success: true,
    data: {
      class: { _id: student.classId._id, name: student.classId.name, section: student.classId.section, gradeNumber: classNumber },
      subjects: data,
      ai: { available: provider.status().available }
    }
  });
});

exports.createSession = asyncHandler(async (req, res) => {
  const student = await currentStudent(req);
  const { subjectId } = req.body;
  const preferredLanguage = req.body.preferredLanguage === 'EN' ? 'EN' : 'BN';

  const subject = await Subject.findById(subjectId);
  if (!subject) throw new ApiError(404, 'Subject not found');
  // Only the subjects of the student's own class — the class comes from
  // their record, never from the request.
  if (!subject.classIds.some((id) => String(id) === String(student.classId._id))) {
    throw new ApiError(403, 'That subject is not taught in your class');
  }

  const session = await AiSession.create({
    studentId: student._id,
    subjectId,
    classNumber: student.classId.gradeNumber,
    preferredLanguage,
    title: subject.name
  });
  await session.populate('subjectId', 'code name nameBn');
  res.status(201).json({ success: true, data: session });
});

exports.listSessions = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new ApiError(404, 'Student profile not found');
  const sessions = await AiSession.find({ studentId: student._id })
    .populate('subjectId', 'code name nameBn')
    .sort({ updatedAt: -1 })
    .limit(30);
  res.json({ success: true, data: sessions });
});

exports.getSession = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new ApiError(404, 'Student profile not found');
  const session = await AiSession.findOne({ _id: req.params.id, studentId: student._id }).populate('subjectId', 'code name nameBn');
  if (!session) throw new ApiError(404, 'Session not found');
  const messages = await AiMessage.find({ sessionId: session._id }).sort({ createdAt: 1 });
  res.json({ success: true, data: { session, messages } });
});

exports.updateSession = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new ApiError(404, 'Student profile not found');
  const session = await AiSession.findOne({ _id: req.params.id, studentId: student._id });
  if (!session) throw new ApiError(404, 'Session not found');
  if (req.body.preferredLanguage === 'EN' || req.body.preferredLanguage === 'BN') {
    session.preferredLanguage = req.body.preferredLanguage;
  }
  await session.save();
  res.json({ success: true, data: session });
});

exports.deleteSession = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new ApiError(404, 'Student profile not found');
  const session = await AiSession.findOneAndDelete({ _id: req.params.id, studentId: student._id });
  if (!session) throw new ApiError(404, 'Session not found');
  await AiMessage.deleteMany({ sessionId: session._id });
  res.json({ success: true, message: 'Chat deleted' });
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const student = await currentStudent(req);
  const session = await AiSession.findOne({ _id: req.params.id, studentId: student._id }).populate('subjectId', 'name nameBn');
  if (!session) throw new ApiError(404, 'Session not found');

  const content = String(req.body.content || '').trim();
  if (!content) throw new ApiError(400, 'Write a question first');
  if (content.length > MAX_QUESTION) throw new ApiError(400, `Keep questions under ${MAX_QUESTION} characters`);

  // Chats started before the class was recorded on the session (and anyone
  // since moved up a class) answer from the class they're in now.
  const classNumber = student.classId.gradeNumber;

  const history = (await AiMessage.find({ sessionId: session._id }).sort({ createdAt: -1 }).limit(8).lean())
    .reverse()
    .map((m) => ({ role: String(m.role).toLowerCase() === 'user' ? 'user' : 'assistant', content: m.content }));

  const userMessage = await AiMessage.create({ sessionId: session._id, role: 'user', content });

  const answer = await answerQuestion({
    classNumber,
    subjectId: session.subjectId._id,
    subjectName: session.subjectId.name,
    subjectNameBn: session.subjectId.nameBn,
    language: session.preferredLanguage || 'BN',
    question: content,
    history
  });

  const assistantMessage = await AiMessage.create({
    sessionId: session._id,
    role: 'assistant',
    content: answer.content,
    sourceChunkIds: answer.sourceChunkIds,
    sources: answer.sources,
    mode: answer.mode
  });

  // The first question names the chat, so the history list is readable.
  if (!history.length) session.title = content.length > 60 ? `${content.slice(0, 57)}…` : content;
  session.classNumber = classNumber;
  session.lastMessageAt = new Date();
  await session.save();

  res.json({ success: true, data: { userMessage, message: assistantMessage, sources: answer.sources } });
});
