/**
 * Routine clashes. A class can't have two periods at once, and a teacher
 * can't be in two classes at once. Periods clash when their times overlap,
 * not only when they start at the same minute (9:00–10:00 and 9:30–10:30
 * clash too).
 */
const Timetable = require('../models/Timetable');
const TeacherAssignment = require('../models/TeacherAssignment');

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const minutes = (hhmm) => {
  const [h, m] = String(hhmm || '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** A period with no end time is taken to last until its start + 1 minute. */
const span = (start, end) => {
  const s = minutes(start);
  const e = end ? minutes(end) : s + 1;
  return [s, Math.max(e, s + 1)];
};

const overlaps = (a, b) => a[0] < b[1] && b[0] < a[1];

/** "Class 8 A Physics, Sunday 10:00–11:00" */
function describe(entry) {
  const cls = entry.classId;
  const subject = entry.teacherAssignmentId?.subjectId;
  const where = [cls ? `${cls.name}${cls.section ? ` ${cls.section}` : ''}` : 'another class', subject?.name].filter(Boolean).join(' ');
  return `${where}, ${DAYS[entry.dayOfWeek] ?? ''} ${entry.startTime}–${entry.endTime}`;
}

const populateEntry = (q) =>
  q.populate('classId', 'name section').populate({ path: 'teacherAssignmentId', populate: { path: 'subjectId', select: 'name' } });

/** Another period of this class that overlaps the given time, or null. */
async function findClassClash({ classId, dayOfWeek, startTime, endTime, excludeId }) {
  const query = { classId, dayOfWeek: Number(dayOfWeek), isActive: true };
  if (excludeId) query._id = { $ne: excludeId };
  const mine = span(startTime, endTime);
  const entries = await populateEntry(Timetable.find(query)).lean();
  return entries.find((e) => overlaps(mine, span(e.startTime, e.endTime))) || null;
}

/**
 * A period anywhere in the school where this teacher is already teaching at
 * an overlapping time, or null. `excludeIds` are periods being moved or
 * handed over, which must not clash with themselves.
 */
async function findTeacherClash({ teacherId, dayOfWeek, startTime, endTime, excludeIds = [] }) {
  const assignments = await TeacherAssignment.find({ teacherId, isActive: true }).select('_id');
  if (!assignments.length) return null;
  const query = {
    teacherAssignmentId: { $in: assignments.map((a) => a._id) },
    dayOfWeek: Number(dayOfWeek),
    isActive: true
  };
  const skip = excludeIds.filter(Boolean).map(String);
  const mine = span(startTime, endTime);
  const entries = await populateEntry(Timetable.find(query)).lean();
  return entries.find((e) => !skip.includes(String(e._id)) && overlaps(mine, span(e.startTime, e.endTime))) || null;
}

/**
 * Before a teacher takes over a class-subject: would any of its periods land
 * on a time they already teach elsewhere? Returns { period, clash } or null.
 */
async function findHandoverClash({ teacherId, assignmentIds }) {
  const periods = await Timetable.find({ teacherAssignmentId: { $in: assignmentIds }, isActive: true }).lean();
  if (!periods.length) return null;
  for (const period of periods) {
    const clash = await findTeacherClash({
      teacherId,
      dayOfWeek: period.dayOfWeek,
      startTime: period.startTime,
      endTime: period.endTime,
      excludeIds: periods.map((p) => p._id)
    });
    if (clash) return { period, clash };
  }
  return null;
}

/**
 * Every place in the routine where a teacher is in two or more classes at
 * once. One item per teacher and overlapping group of periods.
 */
async function listTeacherClashes() {
  const entries = await Timetable.find({ isActive: true })
    .populate('classId', 'name section gradeNumber')
    .populate({ path: 'teacherAssignmentId', populate: [{ path: 'teacherId', select: 'fullName' }, { path: 'subjectId', select: 'name' }] })
    .lean();
  const live = entries.filter((e) => e.teacherAssignmentId?.isActive && e.teacherAssignmentId.teacherId);

  const groups = new Map(); // teacher + day -> periods
  for (const e of live) {
    const key = `${e.teacherAssignmentId.teacherId._id}:${e.dayOfWeek}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }

  const clashes = [];
  for (const periods of groups.values()) {
    periods.sort((a, b) => minutes(a.startTime) - minutes(b.startTime));
    let cluster = [periods[0]];
    let end = span(periods[0].startTime, periods[0].endTime)[1];
    const flush = () => {
      if (cluster.length < 2) return;
      const first = cluster[0];
      clashes.push({
        teacher: first.teacherAssignmentId.teacherId,
        dayOfWeek: first.dayOfWeek,
        day: DAYS[first.dayOfWeek],
        startTime: first.startTime,
        endTime: cluster.reduce((m, p) => (minutes(p.endTime) > minutes(m) ? p.endTime : m), first.endTime),
        periods: cluster.map((p) => ({
          _id: p._id,
          classId: p.classId?._id,
          className: p.classId ? `${p.classId.name}${p.classId.section ? ` ${p.classId.section}` : ''}` : '',
          subject: p.teacherAssignmentId.subjectId?.name,
          startTime: p.startTime,
          endTime: p.endTime
        }))
      });
    };
    for (const p of periods.slice(1)) {
      const [s, e] = span(p.startTime, p.endTime);
      if (s < end) { cluster.push(p); end = Math.max(end, e); }
      else { flush(); cluster = [p]; end = e; }
    }
    flush();
  }
  return clashes.sort((a, b) => a.dayOfWeek - b.dayOfWeek || minutes(a.startTime) - minutes(b.startTime) || a.teacher.fullName.localeCompare(b.teacher.fullName));
}

module.exports = { findClassClash, findTeacherClash, findHandoverClash, listTeacherClashes, describe, DAYS };
