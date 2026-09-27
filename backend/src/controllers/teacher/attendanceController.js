const Teacher = require('../../models/Teacher');
const Student = require('../../models/Student');
const TeacherAssignment = require('../../models/TeacherAssignment');
const AttendanceSession = require('../../models/AttendanceSession');
const AttendanceRecord = require('../../models/AttendanceRecord');
const AcademicSession = require('../../models/AcademicSession');
const SchoolSettings = require('../../models/SchoolSettings');
const { notifyGuardianAbsence } = require('../../services/notificationService');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

const STATUSES = ['PRESENT', 'ABSENT', 'LEAVE'];

// Dates are handled as local calendar days (the server runs on school time).
const dayKey = (d) => new Date(d).toLocaleDateString('en-CA'); // YYYY-MM-DD
const startOfDay = (key) => new Date(`${key}T00:00:00`);
const endOfDay = (key) => new Date(`${key}T23:59:59.999`);

async function currentTeacher(req) {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new ApiError(404, 'Teacher profile not found');
  return teacher;
}

/** The class-subject must be this teacher's own. */
async function ownAssignment(teacher, assignmentId) {
  const assignment = await TeacherAssignment.findOne({ _id: assignmentId, teacherId: teacher._id })
    .populate('classId', 'name section gradeNumber')
    .populate('subjectId', 'code name nameBn');
  if (!assignment) throw new ApiError(403, 'That class and subject are not assigned to you');
  return assignment;
}

exports.createSession = asyncHandler(async (req, res) => {
  const teacher = await currentTeacher(req);
  const assignment = await ownAssignment(teacher, req.body.teacherAssignmentId);

  // One register column per subject per day: opening today's attendance a
  // second time returns the session already taken instead of a duplicate.
  const key = dayKey(req.body.sessionDate || new Date());
  const existing = await AttendanceSession.findOne({
    teacherAssignmentId: assignment._id,
    sessionDate: { $gte: startOfDay(key), $lte: endOfDay(key) }
  }).sort({ createdAt: 1 });
  if (existing) return res.json({ success: true, data: existing });

  const session = await AttendanceSession.create({
    ...req.body,
    classId: assignment.classId._id,
    subjectId: assignment.subjectId._id,
    teacherId: teacher._id,
    status: 'OPEN'
  });
  res.status(201).json({ success: true, data: session });
});

exports.getSession = asyncHandler(async (req, res) => {
  const teacher = await currentTeacher(req);
  const session = await AttendanceSession.findOne({ _id: req.params.sessionId, teacherId: teacher._id })
    .populate('classId', 'name section')
    .populate('subjectId', 'code name nameBn');
  if (!session) throw new ApiError(404, 'Session not found');
  const students = await Student.find({ classId: session.classId, status: 'ACTIVE' }).sort({ fullName: 1 });
  const records = await AttendanceRecord.find({ attendanceSessionId: session._id });
  const recordMap = Object.fromEntries(records.map(r => [r.studentId.toString(), r]));
  res.json({ success: true, data: { session, students, records: recordMap } });
});

exports.saveAttendance = asyncHandler(async (req, res) => {
  const { records } = req.body; // [{studentId, status, note}]
  const teacher = await currentTeacher(req);
  const session = await AttendanceSession.findOne({ _id: req.params.sessionId, teacherId: teacher._id });
  if (!session) throw new ApiError(404, 'Session not found');
  if (session.status === 'LOCKED') throw new ApiError(403, 'Attendance session is locked');
  const ops = records.map(r => ({
    updateOne: {
      filter: { attendanceSessionId: session._id, studentId: r.studentId },
      update: { $set: { status: r.status, note: r.note, markedBy: req.user._id, markedAt: new Date(), updatedAt: new Date(), updatedBy: req.user._id } },
      upsert: true
    }
  }));
  await AttendanceRecord.bulkWrite(ops);
  session.status = 'SUBMITTED'; session.submittedAt = new Date(); session.submittedBy = req.user._id;
  await session.save();
  // Notify guardians of absent students
  const absentRecords = records.filter(r => r.status === 'ABSENT');
  for (const r of absentRecords) {
    notifyGuardianAbsence(r.studentId, session).catch(console.error);
  }
  res.json({ success: true, message: 'Attendance saved', data: { submitted: records.length } });
});

exports.getHistory = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  const sessions = await AttendanceSession.find({ teacherId: teacher._id })
    .populate('classId', 'name section')
    .populate('subjectId', 'code name nameBn')
    .sort({ sessionDate: -1 }).limit(50);
  res.json({ success: true, data: sessions });
});

/**
 * The attendance register: students down the side, class days across the
 * top, one cell per student per day — plus each student's totals and
 * percentage over the chosen period (e.g. up to the half-yearly exam).
 */
exports.getRegister = asyncHandler(async (req, res) => {
  const teacher = await currentTeacher(req);
  const assignment = await ownAssignment(teacher, req.query.assignmentId);

  const [academic, settings] = await Promise.all([
    AcademicSession.findOne({ isCurrent: true }).lean(),
    SchoolSettings.findOne().select('halfYearlyExamDate annualExamDate').lean()
  ]);
  const today = dayKey(new Date());
  const from = req.query.from || (academic?.startDate ? dayKey(academic.startDate) : dayKey(Date.now() - 90 * 864e5));
  const to = req.query.to || today;
  if (from > to) throw new ApiError(400, 'The start date is after the end date');

  const [students, sessions] = await Promise.all([
    Student.find({ classId: assignment.classId._id, status: 'ACTIVE' })
      .select('fullName rollNumber studentId')
      .lean(),
    AttendanceSession.find({
      teacherAssignmentId: assignment._id,
      sessionDate: { $gte: startOfDay(from), $lte: endOfDay(to) }
    }).select('sessionDate status').sort({ sessionDate: 1, createdAt: 1 }).lean()
  ]);

  // Roll order when rolls are numbers, then by name.
  students.sort((a, b) => {
    const ra = parseInt(a.rollNumber, 10), rb = parseInt(b.rollNumber, 10);
    if (!Number.isNaN(ra) && !Number.isNaN(rb) && ra !== rb) return ra - rb;
    return a.fullName.localeCompare(b.fullName);
  });

  const records = await AttendanceRecord.find({ attendanceSessionId: { $in: sessions.map((s) => s._id) } })
    .select('attendanceSessionId studentId status updatedAt')
    .lean();

  // Older data can hold two sessions on one day; they share one column, and
  // the most recently marked status wins.
  const sessionDay = Object.fromEntries(sessions.map((s) => [String(s._id), dayKey(s.sessionDate)]));
  const dates = [...new Set(sessions.map((s) => dayKey(s.sessionDate)))];
  const locked = new Set(sessions.filter((s) => s.status === 'LOCKED').map((s) => dayKey(s.sessionDate)));

  const cells = {};
  const stamp = {};
  for (const r of records) {
    const sid = String(r.studentId);
    const day = sessionDay[String(r.attendanceSessionId)];
    const t = new Date(r.updatedAt).getTime();
    if (!cells[sid]) { cells[sid] = {}; stamp[sid] = {}; }
    if (!stamp[sid][day] || t > stamp[sid][day]) {
      cells[sid][day] = r.status;
      stamp[sid][day] = t;
    }
  }

  const summary = {};
  for (const s of students) {
    const row = cells[String(s._id)] || {};
    const counts = { PRESENT: 0, ABSENT: 0, LEAVE: 0 };
    Object.values(row).forEach((st) => { if (counts[st] !== undefined) counts[st]++; });
    const marked = counts.PRESENT + counts.ABSENT + counts.LEAVE;
    summary[String(s._id)] = {
      present: counts.PRESENT,
      absent: counts.ABSENT,
      leave: counts.LEAVE,
      marked,
      percentage: marked ? Math.round((counts.PRESENT / marked) * 1000) / 10 : null
    };
  }

  res.json({
    success: true,
    data: {
      assignment: {
        _id: assignment._id,
        class: assignment.classId,
        subject: assignment.subjectId
      },
      range: { from, to, today },
      examDates: {
        halfYearly: settings?.halfYearlyExamDate ? dayKey(settings.halfYearlyExamDate) : null,
        annual: settings?.annualExamDate ? dayKey(settings.annualExamDate) : null
      },
      academicYear: academic ? { name: academic.name, start: dayKey(academic.startDate), end: dayKey(academic.endDate) } : null,
      students,
      dates,
      locked: [...locked],
      cells,
      summary
    }
  });
});

/**
 * Saves edited register cells in one go. Each change is a student, a day
 * and a status (or null to clear the cell). A day with no session yet —
 * a new column the teacher added — gets one.
 */
exports.saveRegister = asyncHandler(async (req, res) => {
  const teacher = await currentTeacher(req);
  const assignment = await ownAssignment(teacher, req.body.assignmentId);
  const changes = Array.isArray(req.body.changes) ? req.body.changes : [];
  if (!changes.length) return res.json({ success: true, data: { saved: 0 } });
  if (changes.length > 5000) throw new ApiError(400, 'Too many changes at once');

  const classStudents = new Set(
    (await Student.find({ classId: assignment.classId._id, status: 'ACTIVE' }).select('_id').lean()).map((s) => String(s._id))
  );
  const today = dayKey(new Date());

  const byDay = new Map();
  for (const c of changes) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.date || '')) throw new ApiError(400, 'Invalid date in the register');
    if (c.date > today) throw new ApiError(400, 'Attendance cannot be marked for a future day');
    if (!classStudents.has(String(c.studentId))) throw new ApiError(400, 'A student in the changes is not in this class');
    if (c.status !== null && !STATUSES.includes(c.status)) throw new ApiError(400, 'Invalid attendance status');
    if (!byDay.has(c.date)) byDay.set(c.date, []);
    byDay.get(c.date).push(c);
  }

  let saved = 0;
  for (const [date, dayChanges] of byDay) {
    const sessions = await AttendanceSession.find({
      teacherAssignmentId: assignment._id,
      sessionDate: { $gte: startOfDay(date), $lte: endOfDay(date) }
    }).sort({ createdAt: 1 });
    if (sessions.some((s) => s.status === 'LOCKED')) throw new ApiError(403, `Attendance for ${date} is locked`);

    let session = sessions[0];
    if (!session) {
      session = await AttendanceSession.create({
        teacherAssignmentId: assignment._id,
        classId: assignment.classId._id,
        subjectId: assignment.subjectId._id,
        teacherId: teacher._id,
        sessionDate: new Date(`${date}T09:00:00`),
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submittedBy: req.user._id
      });
    }
    const allIds = sessions.length ? sessions.map((s) => s._id) : [session._id];

    const ops = [];
    for (const c of dayChanges) {
      // Clear the student's mark from any duplicate session of that day, so
      // one day never counts twice.
      ops.push({ deleteMany: { filter: { attendanceSessionId: { $in: allIds.filter((id) => String(id) !== String(session._id)) }, studentId: c.studentId } } });
      if (c.status === null) {
        ops.push({ deleteOne: { filter: { attendanceSessionId: session._id, studentId: c.studentId } } });
      } else {
        ops.push({
          updateOne: {
            filter: { attendanceSessionId: session._id, studentId: c.studentId },
            update: {
              $set: { status: c.status, markedBy: req.user._id, updatedBy: req.user._id, markedAt: new Date() }
            },
            upsert: true
          }
        });
      }
      saved++;
    }
    await AttendanceRecord.bulkWrite(ops);

    if (session.status !== 'SUBMITTED') {
      session.status = 'SUBMITTED';
      session.submittedAt = new Date();
      session.submittedBy = req.user._id;
      await session.save();
    }

    // Guardians hear about today's absences, not corrections to old days.
    if (date === today) {
      for (const c of dayChanges.filter((x) => x.status === 'ABSENT')) {
        notifyGuardianAbsence(c.studentId, session).catch(console.error);
      }
    }
  }

  res.json({ success: true, message: 'Register saved', data: { saved } });
});
