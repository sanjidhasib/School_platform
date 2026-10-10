/**
 * Rearranges the routine so no teacher is in two classes at the same time.
 *
 * Every period keeps its class, subject and teacher; only its day and time
 * may change, and a period stays where it is whenever that doesn't clash.
 * A class also won't get the same subject twice on one day if that can be
 * avoided.
 *
 *   npm run fix-routine                 # dry run: prints the plan, changes nothing
 *   npm run fix-routine -- --apply      # saves a backup, then applies it
 *
 * Optional: hand a class-subject to another teacher as part of the same
 * plan, so the new teacher's periods are placed clash-free too:
 *   --teacher "Class 3 A:BGS=Shahida Akter"
 *
 * The backup (scripts/backups/routine-<time>.json) holds every routine row
 * and changed assignment as they were before.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const env = require('../src/config/env');
const Timetable = require('../src/models/Timetable');
const TeacherAssignment = require('../src/models/TeacherAssignment');
const TeacherRequest = require('../src/models/TeacherRequest');
const Teacher = require('../src/models/Teacher');
require('../src/models/Class');
require('../src/models/Subject');

const APPLY = process.argv.includes('--apply');
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const TIMES = [['09:00', '10:00'], ['10:00', '11:00'], ['11:00', '12:00'], ['12:00', '13:00'], ['13:00', '14:00']];
const SLOTS = DAYS.flatMap((_, d) => TIMES.map((_, t) => ({ day: d, t })));
const slotKey = (s) => `${s.day}-${s.t}`;
const timeIndex = (start) => TIMES.findIndex(([s]) => s === start);

const classLabel = (c) => `${c.name}${c.section ? ` ${c.section}` : ''}`;

function overrides() {
  const out = [];
  process.argv.forEach((a, i) => {
    if (a !== '--teacher') return;
    const m = /^(.+?):(.+?)=(.+)$/.exec(process.argv[i + 1] || '');
    if (!m) throw new Error('Use --teacher "Class 3 A:BGS=Teacher Name"');
    out.push({ classLabel: m[1].trim(), subject: m[2].trim(), teacher: m[3].trim() });
  });
  return out;
}

/** Backtracking search: most-constrained period first, its current slot first. */
function schedule(periods, { sameSubjectSameDay }) {
  const classBusy = new Map(); // classId -> Set(slotKey)
  const teacherBusy = new Map(); // teacherId -> Set(slotKey)
  const subjectDays = new Map(); // classId|subjectId -> Set(day)
  const busy = (map, k) => map.get(k) || map.set(k, new Set()).get(k);
  const placed = new Map(); // period index -> slot
  let steps = 0;

  const ok = (p, s) =>
    !busy(classBusy, p.classId).has(slotKey(s)) &&
    !busy(teacherBusy, p.teacherId).has(slotKey(s)) &&
    (sameSubjectSameDay || !busy(subjectDays, `${p.classId}|${p.subjectId}`).has(s.day));

  const options = (p) =>
    SLOTS.filter((s) => ok(p, s)).sort((a, b) => {
      const keepA = a.day === p.day && a.t === p.t ? 0 : 1;
      const keepB = b.day === p.day && b.t === p.t ? 0 : 1;
      // Prefer: its current slot, then the same time on another day, then nearby times.
      return keepA - keepB || Math.abs(a.t - p.t) - Math.abs(b.t - p.t) || a.day - b.day;
    });

  const put = (i, s, on) => {
    const p = periods[i];
    const op = on ? 'add' : 'delete';
    busy(classBusy, p.classId)[op](slotKey(s));
    busy(teacherBusy, p.teacherId)[op](slotKey(s));
    busy(subjectDays, `${p.classId}|${p.subjectId}`)[op](s.day);
    if (on) placed.set(i, s); else placed.delete(i);
  };

  const solve = () => {
    if (placed.size === periods.length) return true;
    if (++steps > 200000) return false;
    // The unplaced period with the fewest choices left.
    let best = -1, bestOpts = null;
    for (let i = 0; i < periods.length; i++) {
      if (placed.has(i)) continue;
      const o = options(periods[i]);
      if (!bestOpts || o.length < bestOpts.length) { best = i; bestOpts = o; }
      if (!o.length) return false;
    }
    for (const s of bestOpts) {
      put(best, s, true);
      if (solve()) return true;
      put(best, s, false);
    }
    return false;
  };

  return solve() ? placed : null;
}

(async () => {
  await mongoose.connect(env.MONGODB_URI);

  const rows = await Timetable.find({ isActive: true })
    .populate('classId', 'name section gradeNumber')
    .populate({ path: 'teacherAssignmentId', populate: [{ path: 'teacherId', select: 'fullName' }, { path: 'subjectId', select: 'name code' }] })
    .lean();
  const live = rows.filter((r) => r.teacherAssignmentId?.isActive);
  if (live.length !== rows.length) console.log(`Skipping ${rows.length - live.length} periods whose subject has no teacher.`);

  // Teacher changes requested on the command line.
  const changes = [];
  for (const o of overrides()) {
    const row = live.find((r) => classLabel(r.classId) === o.classLabel &&
      [r.teacherAssignmentId.subjectId?.name, r.teacherAssignmentId.subjectId?.code].includes(o.subject));
    if (!row) throw new Error(`No routine periods for ${o.classLabel} ${o.subject}`);
    const teacher = await Teacher.findOne({ fullName: o.teacher });
    if (!teacher) throw new Error(`No teacher called ${o.teacher}`);
    changes.push({ assignmentId: row.teacherAssignmentId._id, from: row.teacherAssignmentId.teacherId, to: teacher, label: `${o.classLabel} ${o.subject}` });
  }
  const teacherOf = (r) => {
    const c = changes.find((x) => String(x.assignmentId) === String(r.teacherAssignmentId._id));
    return c ? c.to : r.teacherAssignmentId.teacherId;
  };

  const periods = live.map((r) => ({
    id: r._id,
    classId: String(r.classId._id),
    className: classLabel(r.classId),
    subjectId: String(r.teacherAssignmentId.subjectId?._id),
    subject: r.teacherAssignmentId.subjectId?.name,
    teacherId: String(teacherOf(r)._id),
    teacher: teacherOf(r).fullName,
    day: r.dayOfWeek,
    t: timeIndex(r.startTime)
  }));
  const odd = periods.filter((p) => p.t < 0 || p.day > 4);
  if (odd.length) throw new Error(`${odd.length} periods are outside Sunday–Thursday 9:00–14:00; fix those by hand first`);

  let plan = schedule(periods, { sameSubjectSameDay: false });
  let relaxed = false;
  if (!plan) { plan = schedule(periods, { sameSubjectSameDay: true }); relaxed = true; }
  if (!plan) throw new Error('No clash-free routine exists with these teachers and periods');

  const moves = periods
    .map((p, i) => ({ p, s: plan.get(i) }))
    .filter(({ p, s }) => s.day !== p.day || s.t !== p.t);

  console.log(`Periods: ${periods.length}. Moving ${moves.length}; ${periods.length - moves.length} stay where they are.`);
  if (relaxed) console.log('Note: a class had to get the same subject twice on some day.');
  for (const c of changes) console.log(`Teacher change: ${c.label}: ${c.from?.fullName} → ${c.to.fullName}`);
  for (const { p, s } of moves.sort((a, b) => a.p.className.localeCompare(b.p.className) || a.p.day - b.p.day || a.p.t - b.p.t)) {
    console.log(`  ${p.className.padEnd(11)} ${p.subject.padEnd(32)} ${p.teacher.padEnd(20)} ${DAYS[p.day].slice(0, 3)} ${TIMES[p.t][0]} → ${DAYS[s.day].slice(0, 3)} ${TIMES[s.t][0]}`);
  }

  if (!APPLY) {
    console.log('\nDry run — nothing changed. Run with --apply to save a backup and apply this plan.');
    return mongoose.disconnect();
  }

  // Backup everything this touches.
  const dir = path.join(__dirname, 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `routine-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  const allRows = await Timetable.find().lean();
  const touchedAssignments = await TeacherAssignment.find({ _id: { $in: changes.map((c) => c.assignmentId) } }).lean();
  fs.writeFileSync(file, JSON.stringify({ timetable: allRows, assignments: touchedAssignments }, null, 2));
  console.log(`\nBackup: ${file}`);

  // Teacher changes, the same way the class page hands a subject over.
  for (const c of changes) {
    await TeacherAssignment.updateOne({ _id: c.assignmentId }, { teacherId: c.to._id });
    await TeacherRequest.updateMany({ teacherAssignmentId: c.assignmentId, status: 'OPEN' }, { teacherId: c.to._id });
  }

  // Removed periods are kept only as inactive rows that nothing reads; they
  // would block the unique class/day/time index while periods move, so they go
  // (they're in the backup).
  const removed = await Timetable.deleteMany({ isActive: false });

  // Two passes so swaps never collide on the class/day/time index.
  const moved = moves.map(({ p, s }) => ({ id: p.id, s }));
  await Promise.all(moved.map((m, i) => Timetable.updateOne({ _id: m.id }, { startTime: `~${i}`, dayOfWeek: 6 })));
  for (const m of moved) {
    await Timetable.updateOne({ _id: m.id }, { dayOfWeek: m.s.day, startTime: TIMES[m.s.t][0], endTime: TIMES[m.s.t][1] });
  }
  console.log(`Applied: ${moved.length} periods moved, ${changes.length} teacher change(s), ${removed.deletedCount} old removed rows cleared.`);
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error(err.message);
  await mongoose.disconnect();
  process.exit(1);
});
