/**
 * Sets every class (3–10) to exactly its NCTB subject list — the catalogue
 * in src/config/nctbCurriculum.js.
 *
 *   node scripts/applyNctbSubjects.js            apply
 *   node scripts/applyNctbSubjects.js --dry-run  show what would change
 *
 * - Missing NCTB subjects are created and attached to the class.
 * - Subjects that are not on a class's NCTB list are detached from it; that
 *   class's teacher assignment and routine periods for the subject are
 *   deactivated (not deleted), so marks, attendance and grades keep their
 *   history.
 * - A backup of every document it changes is written to scripts/backups/,
 *   so the change can be undone.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Subject = require('../src/models/Subject');
const Class = require('../src/models/Class');
const TeacherAssignment = require('../src/models/TeacherAssignment');
const Timetable = require('../src/models/Timetable');
const { curriculumFor } = require('../src/config/nctbCurriculum');

const DRY = process.argv.includes('--dry-run');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/schoolos');
  const classes = await Class.find({ gradeNumber: { $gte: 3, $lte: 10 } }).sort({ gradeNumber: 1 });

  const backup = {
    takenAt: new Date(),
    subjects: await Subject.find().lean(),
    assignments: [],
    timetable: [],
  };
  const report = [];

  // 1. Make sure every NCTB subject exists (by code).
  const allCodes = new Map();
  for (let g = 3; g <= 10; g++) curriculumFor(g).forEach((s) => allCodes.set(s.code, s));
  const byCode = Object.fromEntries((await Subject.find({ code: { $in: [...allCodes.keys()] } })).map((s) => [s.code, s]));
  for (const [code, s] of allCodes) {
    if (byCode[code]) continue;
    report.push(`create ${code} — ${s.name}`);
    if (!DRY) byCode[code] = await Subject.create({ code, name: s.name, nameBn: s.nameBn, classIds: [], isActive: true });
  }

  // 2. Each class gets exactly its NCTB list.
  const allSubjects = await Subject.find();
  for (const cls of classes) {
    const wanted = new Set(curriculumFor(cls.gradeNumber).map((s) => s.code));
    const added = [], removed = [];

    for (const subject of allSubjects.concat(DRY ? [] : Object.values(byCode).filter((s) => !allSubjects.some((x) => x.code === s.code)))) {
      const has = subject.classIds.some((id) => String(id) === String(cls._id));
      const should = wanted.has(subject.code);
      if (should && !has) {
        added.push(subject.code);
        if (!DRY) await Subject.updateOne({ _id: subject._id }, { $addToSet: { classIds: cls._id }, $set: { isActive: true } });
      } else if (!should && has) {
        removed.push(subject.code);
        const assignments = await TeacherAssignment.find({ classId: cls._id, subjectId: subject._id, isActive: { $ne: false } });
        const periods = await Timetable.find({ teacherAssignmentId: { $in: assignments.map((a) => a._id) }, isActive: true });
        backup.assignments.push(...assignments.map((a) => a.toObject()));
        backup.timetable.push(...periods.map((p) => p.toObject()));
        if (!DRY) {
          await Subject.updateOne({ _id: subject._id }, { $pull: { classIds: cls._id } });
          await TeacherAssignment.updateMany({ _id: { $in: assignments.map((a) => a._id) } }, { isActive: false });
          await Timetable.updateMany({ _id: { $in: periods.map((p) => p._id) } }, { isActive: false });
        }
        removed[removed.length - 1] += ` (${assignments.length} teacher, ${periods.length} periods)`;
      }
    }
    report.push(`${cls.name} ${cls.section}: +[${added.join(', ')}]  −[${removed.join(', ')}]`);
  }

  // Subjects no class studies any more are hidden from pickers.
  if (!DRY) {
    const orphaned = await Subject.updateMany({ classIds: { $size: 0 }, isActive: true }, { isActive: false });
    if (orphaned.modifiedCount) report.push(`${orphaned.modifiedCount} subject(s) no class studies were set inactive`);
  }

  if (!DRY) {
    const dir = path.join(__dirname, 'backups');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `nctb-subjects-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(backup, null, 1));
    report.push(`backup: ${path.relative(process.cwd(), file)}`);
  }

  console.log((DRY ? '[dry run] ' : '') + report.join('\n'));
  await mongoose.disconnect();
})();
