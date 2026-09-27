const Subject = require('../../models/Subject');
const Class = require('../../models/Class');
const TeacherAssignment = require('../../models/TeacherAssignment');
const { curriculumFor, SOURCE_NOTE } = require('../../config/nctbCurriculum');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.list = asyncHandler(async (req, res) => {
  const { classId } = req.query;
  const filter = {};
  if (classId) filter.classIds = classId;
  const subjects = await Subject.find(filter).sort({ name: 1 });
  res.json({ success: true, data: subjects });
});
exports.create = asyncHandler(async (req, res) => {
  const subject = await Subject.create(req.body);
  res.status(201).json({ success: true, data: subject });
});
exports.update = asyncHandler(async (req, res) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!subject) throw new ApiError(404, 'Subject not found');
  res.json({ success: true, data: subject });
});
exports.remove = asyncHandler(async (req, res) => {
  if (await TeacherAssignment.exists({ subjectId: req.params.id, isActive: true })) {
    throw new ApiError(409, 'Teachers are still assigned to this subject. Remove it from those classes first.');
  }
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) throw new ApiError(404, 'Subject not found');
  res.json({ success: true, data: { _id: subject._id } });
});

async function classesOfGrade(grade) {
  const g = Number(grade);
  if (!Number.isInteger(g)) throw new ApiError(400, 'Choose a class');
  const classes = await Class.find({ gradeNumber: g, isActive: { $ne: false } }).select('_id name section');
  if (!classes.length) throw new ApiError(404, `There is no Class ${g} in the school yet`);
  return classes;
}

/**
 * The NCTB list for a class, marked against what the school already has:
 * IN_CLASS (taught here), EXISTS (subject exists, not added to this class)
 * or NEW (subject would be created).
 */
exports.curriculum = asyncHandler(async (req, res) => {
  const classes = await classesOfGrade(req.query.grade);
  const classIds = classes.map((c) => String(c._id));
  const items = curriculumFor(req.query.grade);
  const existing = await Subject.find({ code: { $in: items.map((i) => i.code) } }).lean();
  const byCode = Object.fromEntries(existing.map((s) => [s.code, s]));
  res.json({
    success: true,
    data: {
      grade: Number(req.query.grade),
      source: SOURCE_NOTE,
      items: items.map((i) => {
        const s = byCode[i.code];
        const inClass = s && classIds.every((id) => (s.classIds || []).map(String).includes(id));
        return { ...i, subjectId: s?._id, currentName: s?.name, status: inClass ? 'IN_CLASS' : s ? 'EXISTS' : 'NEW' };
      })
    }
  });
});

/** Adds the chosen NCTB subjects to every section of a class. */
exports.applyCurriculum = asyncHandler(async (req, res) => {
  const classes = await classesOfGrade(req.body.grade);
  const wanted = new Set(Array.isArray(req.body.codes) ? req.body.codes : []);
  const items = curriculumFor(req.body.grade).filter((i) => wanted.has(i.code));
  if (!items.length) throw new ApiError(400, 'Choose at least one subject');
  const ids = classes.map((c) => c._id);
  let created = 0, added = 0;
  for (const item of items) {
    let subject = await Subject.findOne({ code: item.code });
    if (!subject) {
      subject = await Subject.create({ code: item.code, name: item.name, nameBn: item.nameBn, classIds: ids, isActive: true });
      created++;
    } else {
      const before = subject.classIds.length;
      await Subject.updateOne({ _id: subject._id }, { $addToSet: { classIds: { $each: ids } }, $set: { isActive: true } });
      const after = (await Subject.findById(subject._id).select('classIds')).classIds.length;
      if (after > before) added++;
    }
  }
  res.json({ success: true, data: { created, added } });
});

/** Takes a subject off a class (all sections) — not while a teacher is assigned. */
exports.removeFromGrade = asyncHandler(async (req, res) => {
  const classes = await classesOfGrade(req.params.grade);
  const ids = classes.map((c) => c._id);
  if (await TeacherAssignment.exists({ subjectId: req.params.id, classId: { $in: ids }, isActive: true })) {
    throw new ApiError(409, 'A teacher is assigned to this subject in that class. Remove the teacher on the class page first.');
  }
  const subject = await Subject.findByIdAndUpdate(req.params.id, { $pull: { classIds: { $in: ids } } }, { new: true });
  if (!subject) throw new ApiError(404, 'Subject not found');
  res.json({ success: true, data: subject });
});
