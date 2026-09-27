/**
 * The student's library: the NCTB books of their own class, and the PDFs
 * themselves. A student can only open books for the class they're in.
 */
const Student = require('../../models/Student');
const TextbookDocument = require('../../models/TextbookDocument');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { sendPdf } = require('../admin/textbookController');

async function studentClass(req) {
  const student = await Student.findOne({ userId: req.user._id }).populate('classId', 'name section gradeNumber');
  if (!student) throw new ApiError(404, 'Student profile not found');
  if (!student.classId?.gradeNumber) throw new ApiError(400, 'You are not in a class yet');
  return student.classId;
}

exports.list = asyncHandler(async (req, res) => {
  const cls = await studentClass(req);
  const books = await TextbookDocument.find({ classNumber: cls.gradeNumber, fileName: { $exists: true } })
    .select('title classNumber subjectId language edition pageCount fileSize status textStatus createdAt')
    .populate('subjectId', 'code name nameBn')
    .sort({ createdAt: -1 });
  res.json({
    success: true,
    data: { class: { name: cls.name, section: cls.section, gradeNumber: cls.gradeNumber }, books }
  });
});

exports.get = asyncHandler(async (req, res) => {
  const cls = await studentClass(req);
  const book = await TextbookDocument.findOne({ _id: req.params.id, classNumber: cls.gradeNumber })
    .select('title classNumber subjectId language edition pageCount fileSize status textStatus')
    .populate('subjectId', 'code name nameBn');
  if (!book) throw new ApiError(404, 'Book not found in your class library');
  res.json({ success: true, data: book });
});

exports.file = asyncHandler(async (req, res) => {
  const cls = await studentClass(req);
  const book = await TextbookDocument.findOne({ _id: req.params.id, classNumber: cls.gradeNumber });
  if (!book?.fileName) throw new ApiError(404, 'Book not found in your class library');
  sendPdf(res, book);
});
