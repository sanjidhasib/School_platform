/**
 * A class at a glance for the office: every subject the class studies, who
 * teaches it, and what the office has asked those teachers to submit.
 * Assigning a teacher happens here too — the separate Assignments page is
 * gone.
 */
const Class = require('../../models/Class');
const Subject = require('../../models/Subject');
const Teacher = require('../../models/Teacher');
const Student = require('../../models/Student');
const TeacherAssignment = require('../../models/TeacherAssignment');
const TeacherRequest = require('../../models/TeacherRequest');
const SubjectGrade = require('../../models/SubjectGrade');
const AcademicSession = require('../../models/AcademicSession');
const { createNotification } = require('../../services/notificationService');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const Timetable = require('../../models/Timetable');
const { findHandoverClash, describe, DAYS } = require('../../services/timetableService');

const TERM_LABEL = { TERM_1: 'Term 1', TERM_2: 'Term 2', FINAL: 'Final' };

exports.overview = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id).populate('classTeacherId', 'fullName');
  if (!cls) throw new ApiError(404, 'Class not found');

  const [subjects, assignments, requests, studentCount] = await Promise.all([
    Subject.find({ classIds: cls._id, isActive: true }).select('code name nameBn').sort({ name: 1 }).lean(),
    TeacherAssignment.find({ classId: cls._id, isActive: true })
      .populate('teacherId', 'fullName specialization photoUrl')
      .lean(),
    TeacherRequest.find({ classId: cls._id, status: { $ne: 'CANCELLED' } }).sort({ createdAt: -1 }).lean(),
    Student.countDocuments({ classId: cls._id, status: 'ACTIVE' })
  ]);

  // Final grades already in, per subject and term.
  const finals = await SubjectGrade.aggregate([
    { $match: { classId: cls._id, status: 'FINAL' } },
    { $group: { _id: { subjectId: '$subjectId', term: '$term' }, n: { $sum: 1 }, at: { $max: '$assignedAt' } } }
  ]);

  const rows = subjects.map((s) => {
    const a = assignments.find((x) => String(x.subjectId) === String(s._id));
    return {
      subject: s,
      assignment: a ? { _id: a._id, teacher: a.teacherId } : null,
      requests: requests.filter((r) => String(r.subjectId) === String(s._id)),
      finalGrades: finals
        .filter((f) => String(f._id.subjectId) === String(s._id))
        .map((f) => ({ term: f._id.term, count: f.n, at: f.at }))
    };
  });

  res.json({ success: true, data: { class: cls, studentCount, rows } });
});

/** Put a teacher on a class-subject, or change who teaches it. */
exports.assign = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) throw new ApiError(404, 'Class not found');
  const { subjectId, teacherId } = req.body;
  const [subject, teacher] = await Promise.all([Subject.findById(subjectId), teacherId ? Teacher.findById(teacherId) : null]);
  if (!subject) throw new ApiError(404, 'Subject not found');
  if (teacherId && !teacher) throw new ApiError(404, 'Teacher not found');

  const current = await TeacherAssignment.findOne({ classId: cls._id, subjectId, isActive: true });
  if (!teacherId) {
    // Unassigning keeps history (attendance, marks) attached to the old
    // assignment, so it is deactivated rather than deleted.
    if (current) { current.isActive = false; await current.save(); }
    return res.json({ success: true, data: null });
  }
  if (current && String(current.teacherId) === String(teacherId)) return res.json({ success: true, data: current });
  if (teacher.status === 'INACTIVE') throw new ApiError(400, `${teacher.fullName} is inactive`);

  // The new teacher takes over this class-subject's periods in the routine;
  // none of them may fall on a time they already teach another class.
  const revived = current ? null : await TeacherAssignment.findOne({ classId: cls._id, subjectId, teacherId: teacher._id });
  // Periods left behind when this subject's teacher was removed earlier: the
  // new teacher takes those over too, so the routine shows who teaches now.
  const leftBehind = current ? [] : await TeacherAssignment.find({
    classId: cls._id, subjectId, isActive: false, _id: { $ne: revived?._id }
  }).select('_id').lean();
  const handedOver = [current?._id, revived?._id, ...leftBehind.map((a) => a._id)].filter(Boolean);
  if (handedOver.length) {
    const hit = await findHandoverClash({ teacherId: teacher._id, assignmentIds: handedOver });
    if (hit) {
      const { period, clash } = hit;
      throw new ApiError(409,
        `${teacher.fullName} already teaches ${describe(clash)}, the same time as ${subject.name} in this class ` +
        `(${DAYS[period.dayOfWeek]} ${period.startTime}–${period.endTime}). A teacher can't be in two classes at once: change one of the periods in the routine first.`);
    }
  }

  const session = await AcademicSession.findOne({ isCurrent: true });
  if (current) {
    // Changing the teacher: the routine and records move with the class
    // and subject, so the existing assignment is handed over.
    current.teacherId = teacher._id;
    await current.save();
    await TeacherRequest.updateMany({ teacherAssignmentId: current._id, status: 'OPEN' }, { teacherId: teacher._id });
    return res.json({ success: true, data: current });
  }
  const adopt = (assignmentId) => leftBehind.length
    ? Timetable.updateMany({ teacherAssignmentId: { $in: leftBehind.map((a) => a._id) }, isActive: true }, { teacherAssignmentId: assignmentId })
    : null;
  if (revived) {
    revived.isActive = true;
    await revived.save();
    await adopt(revived._id);
    return res.json({ success: true, data: revived });
  }
  const created = await TeacherAssignment.create({
    classId: cls._id, subjectId, teacherId: teacher._id, academicSessionId: session?._id, isActive: true
  });
  await adopt(created._id);
  res.status(201).json({ success: true, data: created });
});

/**
 * Ask teachers of this class to submit grades and/or attendance. Each
 * teacher gets a notification and sees the request on their profile.
 * { subjectIds?: [] (default: every assigned subject), types: [], term, upTo, dueDate, message }
 */
exports.request = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) throw new ApiError(404, 'Class not found');
  const types = (Array.isArray(req.body.types) ? req.body.types : []).filter((t) => ['GRADES', 'ATTENDANCE'].includes(t));
  if (!types.length) throw new ApiError(400, 'Choose what to ask for: grades, attendance or both');
  const term = TERM_LABEL[req.body.term] ? req.body.term : 'TERM_1';

  const filter = { classId: cls._id, isActive: true };
  if (Array.isArray(req.body.subjectIds) && req.body.subjectIds.length) filter.subjectId = { $in: req.body.subjectIds };
  const assignments = await TeacherAssignment.find(filter).populate('teacherId', 'fullName userId').populate('subjectId', 'name');
  if (!assignments.length) throw new ApiError(400, 'No teachers are assigned to those subjects yet');

  const upTo = req.body.upTo ? new Date(req.body.upTo) : undefined;
  const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : undefined;
  const message = String(req.body.message || '').slice(0, 500);
  const created = [];

  for (const a of assignments) {
    for (const type of types) {
      // One open request of a kind per class-subject: asking again updates it.
      const existing = await TeacherRequest.findOne({ teacherAssignmentId: a._id, type, status: 'OPEN', ...(type === 'GRADES' ? { term } : {}) });
      const doc = existing || new TeacherRequest({ type, teacherAssignmentId: a._id, teacherId: a.teacherId._id, classId: cls._id, subjectId: a.subjectId._id, requestedBy: req.user._id });
      Object.assign(doc, { term: type === 'GRADES' ? term : undefined, upTo: type === 'ATTENDANCE' ? upTo : undefined, dueDate, message });
      await doc.save();
      created.push(doc);

      if (a.teacherId.userId) {
        const what = type === 'GRADES' ? `${TERM_LABEL[term]} final grades` : 'attendance';
        await createNotification({
          recipientUserId: a.teacherId.userId,
          type: 'SYSTEM',
          title: `Office request: ${what} for ${cls.name} ${cls.section}`,
          message: `Please submit ${what} for ${a.subjectId.name}, ${cls.name} ${cls.section}${dueDate ? ` by ${dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}.${message ? ` ${message}` : ''}`,
          relatedEntityType: 'TeacherRequest',
          relatedEntityId: doc._id
        });
      }
    }
  }
  res.status(201).json({ success: true, data: { sent: created.length } });
});

exports.cancelRequest = asyncHandler(async (req, res) => {
  const r = await TeacherRequest.findByIdAndUpdate(req.params.requestId, { status: 'CANCELLED' }, { new: true });
  if (!r) throw new ApiError(404, 'Request not found');
  res.json({ success: true, data: r });
});
