#!/usr/bin/env node
/**
 * SchoolOS Complete Seed Script
 * Seeds Barishal Zilla School with realistic Bangladeshi demo data
 * Usage: node scripts/seed.js [--force]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const AcademicSession = require('../src/models/AcademicSession');
const SchoolSettings = require('../src/models/SchoolSettings');
const Class = require('../src/models/Class');
const Subject = require('../src/models/Subject');
const Teacher = require('../src/models/Teacher');
const Student = require('../src/models/Student');
const Guardian = require('../src/models/Guardian');
const TeacherAssignment = require('../src/models/TeacherAssignment');
const Timetable = require('../src/models/Timetable');
const AttendanceSession = require('../src/models/AttendanceSession');
const AttendanceRecord = require('../src/models/AttendanceRecord');
const Homework = require('../src/models/Homework');
const HomeworkSubmission = require('../src/models/HomeworkSubmission');
const Assessment = require('../src/models/Assessment');
const Mark = require('../src/models/Mark');
const SubjectGrade = require('../src/models/SubjectGrade');
const Notice = require('../src/models/Notice');
const Achievement = require('../src/models/Achievement');
const Notification = require('../src/models/Notification');
const TextbookChunk = require('../src/models/TextbookChunk');
const TextbookDocument = require('../src/models/TextbookDocument');

const hash = (pw) => bcrypt.hash(pw, 10);

const TEACHER_PASSWORD = 'Teacher@123';
const STUDENT_PASSWORD = 'Student@123';
const GUARDIAN_PASSWORD = 'Guardian@123';

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

const BANGLA_FIRST = ['Rahim', 'Karim', 'Arif', 'Sakib', 'Fahim', 'Nabil', 'Tanvir', 'Rafiq', 'Imran', 'Mahfuz', 'Sharif', 'Tariq', 'Mamun', 'Sumon', 'Rashed', 'Farhan', 'Zahir', 'Belal', 'Rubel', 'Monir'];
const BANGLA_FEMALE_FIRST = ['Sharmin', 'Fatema', 'Nasrin', 'Rima', 'Tania', 'Sadia', 'Mitu', 'Poly', 'Riya', 'Nadia', 'Muna', 'Sumi', 'Lima', 'Piya', 'Dipa', 'Sima', 'Rina', 'Mina', 'Lina', 'Bina'];
const BANGLA_LAST = ['Ahmed', 'Hossain', 'Islam', 'Rahman', 'Khan', 'Akter', 'Begum', 'Miah', 'Sarkar', 'Chowdhury', 'Uddin', 'Ali', 'Bhuiyan', 'Mahmud', 'Mondal'];
const TEACHER_DEGREES = ['B.Ed., M.A.', 'M.Sc., B.Ed.', 'M.A., B.Ed.', 'M.Com., B.Ed.', 'B.Sc., M.Sc.', 'M.B.A.', 'Ph.D.'];

const maleTeachers = [
  { name: 'Md. Abul Kalam', degree: 'M.Sc., B.Ed.', spec: 'Mathematics' },
  { name: 'Md. Rafiqul Islam', degree: 'M.A., B.Ed.', spec: 'English' },
  { name: 'Md. Jahangir Alam', degree: 'B.Sc., M.Sc.', spec: 'ICT' },
  { name: 'Md. Anisur Rahman', degree: 'M.A., B.Ed.', spec: 'Bangla' },
  { name: 'Md. Habibur Rahman', degree: 'M.Sc., B.Ed.', spec: 'Science' },
  { name: 'Md. Shahidul Islam', degree: 'M.A., B.Ed.', spec: 'Social Studies' },
  { name: 'Md. Zahurul Haque', degree: 'M.A., B.Ed.', spec: 'Religion' },
  { name: 'Md. Monirul Islam', degree: 'M.Sc., B.Ed.', spec: 'Mathematics' },
];
const femaleTeachers = [
  { name: 'Fatema Khanam', degree: 'M.A., B.Ed.', spec: 'Bangla' },
  { name: 'Nasrin Sultana', degree: 'M.Sc., B.Ed.', spec: 'Science' },
  { name: 'Roksana Begum', degree: 'M.A., B.Ed.', spec: 'English' },
  { name: 'Shahida Akter', degree: 'M.A., B.Ed.', spec: 'Social Studies' },
  { name: 'Moriom Begum', degree: 'M.Sc., B.Ed.', spec: 'Mathematics' },
  { name: 'Afroza Khatun', degree: 'B.Sc., M.Sc.', spec: 'ICT' },
  { name: 'Halima Begum', degree: 'M.A., B.Ed.', spec: 'Religion' },
];
const allTeachers = [...maleTeachers, ...femaleTeachers];

const SUBJECTS_DATA = [
  { code: 'BAN', name: 'Bangla', nameBn: 'à¦¬à¦¾à¦‚à¦²à¦¾' },
  { code: 'ENG', name: 'English', nameBn: 'à¦‡à¦‚à¦°à§‡à¦œà¦¿' },
  { code: 'MAT', name: 'Mathematics', nameBn: 'à¦—à¦£à¦¿à¦¤' },
  { code: 'SCI', name: 'Science', nameBn: 'à¦¬à¦¿à¦œà§à¦žà¦¾à¦¨' },
  { code: 'ICT', name: 'ICT', nameBn: 'à¦¤à¦¥à§à¦¯ à¦“ à¦¯à§‹à¦—à¦¾à¦¯à§‹à¦— à¦ªà§à¦°à¦¯à§à¦•à§à¦¤à¦¿' },
  { code: 'BGS', name: 'BGS', nameBn: 'à¦¬à¦¾à¦‚à¦²à¦¾à¦¦à§‡à¦¶ à¦“ à¦—à§à¦²à§‹à¦¬à¦¾à¦² à¦¸à§à¦Ÿà¦¾à¦¡à¦¿à¦œ' },
  { code: 'HSS', name: 'History & Social Science', nameBn: 'à¦‡à¦¤à¦¿à¦¹à¦¾à¦¸ à¦“ à¦¸à¦¾à¦®à¦¾à¦œà¦¿à¦• à¦¬à¦¿à¦œà§à¦žà¦¾à¦¨' },
  { code: 'REL', name: 'Religion & Moral Values', nameBn: 'à¦§à¦°à§à¦® à¦“ à¦¨à§ˆà¦¤à¦¿à¦• à¦¶à¦¿à¦•à§à¦·à¦¾' },
];

const PERIODS = [
  { startTime: '09:00', endTime: '10:00' },
  { startTime: '10:00', endTime: '11:00' },
  { startTime: '11:00', endTime: '12:00' },
  { startTime: '12:00', endTime: '13:00' },
  { startTime: '13:00', endTime: '14:00' },
];

const ACTIVE_DAYS = [0, 1, 2, 3, 4]; // Sunâ€“Thu

const GRADING_SCALE = [
  { minPercentage: 80, maxPercentage: 100, grade: 'A+', gradePoint: 5.0 },
  { minPercentage: 70, maxPercentage: 79.99, grade: 'A', gradePoint: 4.0 },
  { minPercentage: 60, maxPercentage: 69.99, grade: 'A-', gradePoint: 3.5 },
  { minPercentage: 50, maxPercentage: 59.99, grade: 'B', gradePoint: 3.0 },
  { minPercentage: 40, maxPercentage: 49.99, grade: 'C', gradePoint: 2.0 },
  { minPercentage: 33, maxPercentage: 39.99, grade: 'D', gradePoint: 1.0 },
  { minPercentage: 0, maxPercentage: 32.99, grade: 'F', gradePoint: 0.0 },
];

function getGrade(pct) {
  for (const g of GRADING_SCALE) {
    if (pct >= g.minPercentage && pct <= g.maxPercentage) return g;
  }
  return GRADING_SCALE[GRADING_SCALE.length - 1];
}

const log = (msg) => console.log(`  âœ“ ${msg}`);

async function seed() {
  await connectDB();
  console.log('\nðŸŒ± SchoolOS Seed Script â€” Barishal Zilla School\n');

  // â”€â”€ Clear â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('ðŸ—‘  Clearing existing data...');
  const models = [User, AcademicSession, SchoolSettings, Class, Subject, Teacher, Student,
    Guardian, TeacherAssignment, Timetable, AttendanceSession, AttendanceRecord,
    Homework, HomeworkSubmission, Assessment, Mark, SubjectGrade, Notice, Achievement,
    Notification, TextbookChunk, TextbookDocument];
  for (const M of models) await M.deleteMany({});
  log('All collections cleared');

  // â”€â”€ SchoolSettings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nâš™ï¸  School Settings...');
  await SchoolSettings.create({
    name: 'Barishal Zilla School',
    logoUrl: '',
    address: 'Sadar Road, Barishal Sadar, Barishal-8200, Bangladesh',
    contactPhone: '+880-431-21734',
    contactEmail: 'info@barishal-zillaschool.edu.bd',
    activeDays: ACTIVE_DAYS,
    periods: PERIODS.map((p, i) => ({ name: `Period ${i + 1}`, ...p })),
    gradingScale: GRADING_SCALE,
  });
  log('School settings created');

  // â”€â”€ Academic Session â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nðŸ“… Academic Session...');
  const academicSession = await AcademicSession.create({
    name: '2026 Academic Year',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    isCurrent: true,
  });
  log('Academic session 2026 created');

  // â”€â”€ Admin User â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nðŸ‘¤ Admin User...');
  await User.create({
    username: 'admin',
    email: 'admin@barishal-zillaschool.edu.bd',
    passwordHash: await hash('Admin@123'),
    role: 'ADMIN',
    isActive: true,
    mustChangePassword: false,
    phone: '+8801711000000',
  });
  log('Admin: admin@barishal-zillaschool.edu.bd / Admin@123');

  // â”€â”€ Classes 3â€“10 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nðŸ« Classes 3â€“10...');
  const classesData = [];
  for (let g = 3; g <= 10; g++) {
    const cls = await Class.create({
      name: `Class ${g}`,
      gradeNumber: g,
      section: 'A',
      academicSessionId: academicSession._id,
      capacity: 40,
      room: `Room ${g + 100}`,
      isActive: true,
    });
    classesData.push(cls);
  }
  log(`${classesData.length} classes created (Class 3â€“10)`);

  // â”€â”€ Subjects â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nðŸ“š Subjects...');
  const subjectDocs = [];
  for (const sd of SUBJECTS_DATA) {
    const classIds = classesData.map(c => c._id);
    const subj = await Subject.create({ ...sd, classIds, isActive: true });
    subjectDocs.push(subj);
  }
  log(`${subjectDocs.length} subjects created`);
  const subjectByCode = Object.fromEntries(subjectDocs.map(s => [s.code, s]));

  // â”€â”€ Teachers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nðŸ‘©â€ðŸ« Teachers...');
  const teacherDocs = [];
  for (let i = 0; i < allTeachers.length; i++) {
    const t = allTeachers[i];
    const idx = String(i + 1).padStart(3, '0');
    const username = `teacher${idx}`;
    const email = `${username}@barishal-zillaschool.edu.bd`;
    const user = await User.create({
      username, email,
      passwordHash: await hash(TEACHER_PASSWORD),
      role: 'TEACHER', isActive: true, mustChangePassword: false,
      phone: `+88017${randInt(10000000, 99999999)}`,
    });
    const teacher = await Teacher.create({
      userId: user._id,
      teacherId: `TCH${idx}`,
      fullName: t.name,
      degree: t.degree,
      specialization: t.spec,
      phone: user.phone,
      email,
      joiningDate: daysAgo(randInt(365, 2000)),
      status: 'ACTIVE',
    });
    teacherDocs.push(teacher);
  }
  log(`${teacherDocs.length} teachers created`);

  // â”€â”€ Teacher Assignments (2â€“3 subjects per teacher across classes) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nðŸ“‹ Teacher Assignments...');
  const assignments = [];

  // Strategy: assign each subject in each class to a teacher
  // Each teacher handles their specialty subject across 2-3 classes
  const specialtyMap = {
    'Mathematics': 'MAT', 'Bangla': 'BAN', 'English': 'ENG',
    'Science': 'SCI', 'ICT': 'ICT', 'Social Studies': 'BGS',
    'History & Social Science': 'HSS', 'Religion': 'REL',
  };

  let assignmentCount = 0;
  for (const cls of classesData) {
    for (const subj of subjectDocs) {
      // Find a teacher specializing in this subject
      const matchedTeachers = teacherDocs.filter(t => {
        const code = specialtyMap[t.specialization];
        return code === subj.code;
      });
      const teacher = matchedTeachers.length > 0
        ? pick(matchedTeachers)
        : pick(teacherDocs);

      const asgn = await TeacherAssignment.create({
        teacherId: teacher._id,
        classId: cls._id,
        subjectId: subj._id,
        academicSessionId: academicSession._id,
        isActive: true,
      });
      assignments.push(asgn);
      assignmentCount++;
    }
  }
  log(`${assignmentCount} teacher assignments created`);

  // â”€â”€ Timetable â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nðŸ—“  Timetable...');
  let ttCount = 0;
  const timetableEntries = [];

  for (const cls of classesData) {
    // 5 subjects per day Ã— 5 days = 25 slots per class
    // Pick 5 subjects for each class (they all have 8, rotate daily)
    const classAssignments = assignments.filter(a => a.classId.toString() === cls._id.toString());

    // Shuffle and assign subjects to periods across the week
    let assignIdx = 0;
    for (const day of ACTIVE_DAYS) {
      for (const period of PERIODS) {
        const asgn = classAssignments[assignIdx % classAssignments.length];
        assignIdx++;
        const entry = await Timetable.create({
          classId: cls._id,
          teacherAssignmentId: asgn._id,
          dayOfWeek: day,
          startTime: period.startTime,
          endTime: period.endTime,
          room: cls.room,
          academicSessionId: academicSession._id,
          isActive: true,
        });
        timetableEntries.push(entry);
        ttCount++;
      }
    }
  }
  log(`${ttCount} timetable entries created`);

  // â”€â”€ Students & Guardians â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nðŸŽ“ Students & Guardians...');
  const studentDocs = [];
  let studentIdx = 1;
  let guardianIdx = 1;

  for (const cls of classesData) {
    const count = randInt(22, 30); // 22-30 per class, well under 40
    for (let i = 0; i < count; i++) {
      const isFemale = i % 3 === 0;
      const firstName = isFemale ? pick(BANGLA_FEMALE_FIRST) : pick(BANGLA_FIRST);
      const lastName = pick(BANGLA_LAST);
      const fullName = `${firstName} ${lastName}`;
      const sidx = String(studentIdx).padStart(3, '0');
      const username = `student${sidx}`;
      const email = `${username}@barishal-zillaschool.edu.bd`;

      const sUser = await User.create({
        username, email,
        passwordHash: await hash(STUDENT_PASSWORD),
        role: 'STUDENT', isActive: true, mustChangePassword: false,
        phone: `+88018${randInt(10000000, 99999999)}`,
      });

      // Guardian
      const guardianName = `${pick(['Md.', 'Mr.', 'Mrs.'])} ${pick(BANGLA_FIRST)} ${lastName}`;
      const gidx = String(guardianIdx).padStart(3, '0');
      const gUsername = `guardian${gidx}`;
      const gEmail = `${gUsername}@barishal-zillaschool.edu.bd`;
      const gUser = await User.create({
        username: gUsername, email: gEmail,
        passwordHash: await hash(GUARDIAN_PASSWORD),
        role: 'GUARDIAN', isActive: true, mustChangePassword: false,
        phone: `+88019${randInt(10000000, 99999999)}`,
      });
      guardianIdx++;

      const student = await Student.create({
        userId: sUser._id,
        studentId: `STU${sidx}`,
        fullName,
        dateOfBirth: new Date(2026 - (cls.gradeNumber + 8), randInt(0, 11), randInt(1, 28)),
        gender: isFemale ? 'Female' : 'Male',
        phone: sUser.phone,
        address: `House ${randInt(1, 200)}, Road ${randInt(1, 20)}, Dhaka`,
        classId: cls._id,
        guardianIds: [], // will update after
        admissionDate: daysAgo(randInt(30, 365 * 3)),
        status: 'ACTIVE',
      });

      const guardian = await Guardian.create({
        userId: gUser._id,
        fullName: guardianName,
        relation: isFemale ? 'Mother' : 'Father',
        phone: gUser.phone,
        email: gEmail,
        address: student.address,
        studentIds: [student._id],
      });

      await Student.findByIdAndUpdate(student._id, { guardianIds: [guardian._id] });
      student.guardianIds = [guardian._id];
      studentDocs.push({ student, guardian, cls });
      studentIdx++;
    }
  }
  log(`${studentDocs.length} students created with guardians`);

  // â”€â”€ Attendance (past 3 weeks) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nâœ… Attendance Records (3 weeks)...');
  let attSessionCount = 0;
  let attRecordCount = 0;
  const adminUser = await User.findOne({ role: 'ADMIN' });

  for (let weeksAgo = 3; weeksAgo >= 1; weeksAgo--) {
    for (const day of ACTIVE_DAYS) {
      const sessionDate = new Date();
      const daysOffset = (weeksAgo * 7) - day;
      sessionDate.setDate(sessionDate.getDate() - daysOffset);
      sessionDate.setHours(0, 0, 0, 0);

      for (const cls of classesData) {
        const classAssignments = assignments.filter(a => a.classId.toString() === cls._id.toString());
        const period = PERIODS[0]; // Just morning period for demo
        const asgn = classAssignments[0];
        if (!asgn) continue;

        const attSession = await AttendanceSession.create({
          timetableId: timetableEntries.find(t =>
            t.classId.toString() === cls._id.toString() &&
            t.dayOfWeek === day &&
            t.startTime === period.startTime
          )?._id,
          teacherAssignmentId: asgn._id,
          classId: cls._id,
          subjectId: asgn.subjectId,
          teacherId: asgn.teacherId,
          sessionDate,
          startTime: period.startTime,
          endTime: period.endTime,
          status: 'SUBMITTED',
          submittedAt: new Date(sessionDate.getTime() + 45 * 60000),
          submittedBy: adminUser._id,
        });
        attSessionCount++;

        const classStudents = studentDocs.filter(s => s.cls._id.toString() === cls._id.toString());
        for (const { student } of classStudents) {
          const rand = Math.random();
          const status = rand > 0.88 ? 'ABSENT' : rand > 0.93 ? 'LEAVE' : 'PRESENT';
          await AttendanceRecord.create({
            attendanceSessionId: attSession._id,
            studentId: student._id,
            status,
            markedBy: adminUser._id,
            markedAt: new Date(sessionDate.getTime() + 15 * 60000),
          });
          attRecordCount++;
        }
      }
    }
  }
  log(`${attSessionCount} attendance sessions, ${attRecordCount} records created`);

  // â”€â”€ Homework â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nðŸ“ Homework...');
  const homeworkDocs = [];
  const hwTitles = ['Chapter Exercise', 'Reading Assignment', 'Problem Set', 'Creative Writing', 'Lab Report', 'Group Project Summary'];

  for (const cls of classesData) {
    const classAssignments = assignments.filter(a => a.classId.toString() === cls._id.toString());
    for (let h = 0; h < 4; h++) {
      const asgn = classAssignments[h % classAssignments.length];
      const dueOffset = h < 2 ? -randInt(1, 7) : randInt(1, 7); // some overdue, some upcoming
      const hw = await Homework.create({
        teacherAssignmentId: asgn._id,
        classId: cls._id,
        subjectId: asgn.subjectId,
        teacherId: asgn.teacherId,
        title: `${hwTitles[h % hwTitles.length]} ${h + 1}`,
        description: `Complete the assigned problems and submit your work neatly. Show all working steps.`,
        assignedAt: daysAgo(randInt(5, 10)),
        dueAt: new Date(Date.now() + dueOffset * 24 * 60 * 60 * 1000),
        maxMarks: pick([10, 20, 25, 50]),
        status: 'PUBLISHED',
      });
      homeworkDocs.push({ hw, cls, asgn });
    }
  }
  log(`${homeworkDocs.length} homework items created`);

  // â”€â”€ Homework Submissions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let subCount = 0;
  for (const { hw, cls } of homeworkDocs) {
    const classStudents = studentDocs.filter(s => s.cls._id.toString() === cls._id.toString());
    for (const { student } of classStudents) {
      const rand = Math.random();
      if (rand < 0.25) continue; // 25% no submission
      const isLate = new Date(hw.dueAt) < new Date() && Math.random() > 0.6;
      const marks = randInt(Math.floor(hw.maxMarks * 0.4), hw.maxMarks);
      const isGraded = Math.random() > 0.4;
      await HomeworkSubmission.create({
        homeworkId: hw._id,
        studentId: student._id,
        answerText: 'Student submitted their answer here.',
        submittedAt: isLate ? new Date(hw.dueAt.getTime() + randInt(1, 48) * 3600000) : daysAgo(randInt(0, 3)),
        status: isGraded ? 'GRADED' : isLate ? 'LATE' : 'SUBMITTED',
        marks: isGraded ? marks : undefined,
        feedback: isGraded ? pick(['Good work!', 'Needs improvement', 'Excellent!', 'Well done', 'Review chapter 3']) : undefined,
        gradedAt: isGraded ? new Date() : undefined,
        gradedBy: isGraded ? adminUser._id : undefined,
      });
      subCount++;
    }
  }
  log(`${subCount} homework submissions created`);

  // â”€â”€ Assessments & Marks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nðŸ“Š Assessments & Marks...');
  let markCount = 0;

  for (const cls of classesData) {
    const classAssignments = assignments.filter(a => a.classId.toString() === cls._id.toString());
    const classStudents = studentDocs.filter(s => s.cls._id.toString() === cls._id.toString());

    for (let ai = 0; ai < Math.min(3, classAssignments.length); ai++) {
      const asgn = classAssignments[ai];
      const types = ['CLASS_TEST', 'MIDTERM', 'FINAL'];
      const assessment = await Assessment.create({
        teacherAssignmentId: asgn._id,
        classId: cls._id,
        subjectId: asgn.subjectId,
        teacherId: asgn.teacherId,
        academicSessionId: academicSession._id,
        term: 'TERM_1',
        title: `${['Class Test 1', 'Midterm Exam', 'Final Exam'][ai]}`,
        type: types[ai],
        assessmentDate: daysAgo(randInt(10, 60)),
        maxMarks: [20, 50, 100][ai],
        weight: [10, 30, 60][ai],
        status: 'PUBLISHED',
      });

      for (const { student } of classStudents) {
        const maxM = assessment.maxMarks;
        const obtained = randInt(Math.floor(maxM * 0.33), maxM);
        await Mark.create({
          assessmentId: assessment._id,
          studentId: student._id,
          obtainedMarks: obtained,
          absent: Math.random() < 0.04,
          enteredBy: adminUser._id,
          enteredAt: new Date(),
        });
        markCount++;
      }
    }
  }
  log(`${markCount} marks records created`);

  // â”€â”€ Subject Grades â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nðŸŽ–  Subject Grades...');
  let gradeCount = 0;

  for (const cls of classesData) {
    const classAssignments = assignments.filter(a => a.classId.toString() === cls._id.toString());
    const classStudents = studentDocs.filter(s => s.cls._id.toString() === cls._id.toString());

    for (const asgn of classAssignments.slice(0, 5)) {
      for (const { student } of classStudents) {
        const pct = randInt(35, 97);
        const gradeInfo = getGrade(pct);
        await SubjectGrade.create({
          studentId: student._id,
          classId: cls._id,
          subjectId: asgn.subjectId,
          teacherAssignmentId: asgn._id,
          academicSessionId: academicSession._id,
          term: 'TERM_1',
          percentage: pct,
          grade: gradeInfo.grade,
          gradePoint: gradeInfo.gradePoint,
          status: 'FINAL',
          assignedBy: adminUser._id,
          assignedAt: new Date(),
        });
        gradeCount++;
      }
    }
  }
  log(`${gradeCount} subject grades created`);

  // â”€â”€ Notices â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nðŸ“¢ Notices & Events...');
  const noticesData = [
    { title: 'Annual Examination Schedule 2026', description: 'The annual final examination will be held from December 1-15, 2026. Students must bring their admit cards.', category: 'EXAM', eventDate: new Date('2026-12-01'), audience: 'ALL' },
    { title: 'Parent-Teacher Meeting', description: 'A parent-teacher meeting is scheduled for this month to discuss student progress. All guardians are requested to attend.', category: 'EVENT', eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), audience: 'ALL' },
    { title: 'Eid-ul-Adha Holiday', description: 'The school will remain closed from June 16â€“20 for Eid-ul-Adha celebrations. Classes resume June 23.', category: 'HOLIDAY', eventDate: new Date('2026-06-16'), audience: 'ALL' },
    { title: 'Annual Science Fair 2026', description: 'Students are invited to participate in the Annual Science Fair. Submit project proposals to your class teacher by October 15.', category: 'ACADEMIC', eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), audience: 'ALL' },
    { title: 'Monthly Test â€” October', description: 'Monthly class tests will be held in the last week of October. Syllabus: chapters covered in September-October.', category: 'EXAM', eventDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), audience: 'ALL' },
    { title: 'National Day Celebration', description: 'The school will celebrate Victory Day on December 16. All students must wear school uniform.', category: 'EVENT', eventDate: new Date('2026-12-16'), audience: 'ALL' },
  ];

  for (const nd of noticesData) {
    await Notice.create({
      title: nd.title, description: nd.description,
      category: nd.category,
      audienceType: 'ALL',
      publishAt: new Date(),
      eventDate: nd.eventDate,
      authorUserId: adminUser._id,
      isPublished: true,
    });
  }
  log(`${noticesData.length} notices created`);

  // â”€â”€ Achievements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nðŸ† Achievements...');
  const achievementsData = [
    { title: 'National Science Olympiad â€” Gold Medal', description: 'Our students won the Gold Medal at the National Science Olympiad 2026 held in Dhaka.', category: 'Academic', date: new Date('2026-03-15'), order: 1 },
    { title: 'Inter-School Debate Championship', description: 'Barishal Zilla School won the Inter-School Debate Championship, defeating 32 schools nationwide.', category: 'Extracurricular', date: new Date('2026-02-20'), order: 2 },
    { title: 'National ICT Olympiad â€” 1st Place', description: 'Our Class 9 students secured first place at the National ICT Olympiad 2026.', category: 'Technology', date: new Date('2026-04-10'), order: 3 },
    { title: 'Football Tournament Champions', description: 'Barishal Zilla School won the Barishal District Inter-School Football Tournament 2026.', category: 'Sports', date: new Date('2026-01-25'), order: 4 },
    { title: 'National Essay Writing Competition', description: 'Five students from Classes 8â€“10 won prizes at the National Bangla Essay Writing Competition.', category: 'Academic', date: new Date('2026-05-05'), order: 5 },
    { title: 'Best School Award â€” Barishal District', description: 'Barishal Zilla School received the Best School Award from Barishal District Education Board for 2025.', category: 'Institutional', date: new Date('2025-12-01'), order: 6 },
  ];

  for (const a of achievementsData) {
    await Achievement.create({
      title: a.title, description: a.description,
      category: a.category, achievementDate: a.date,
      displayOrder: a.order, isPublished: true,
      createdBy: adminUser._id,
    });
  }
  log(`${achievementsData.length} achievements created`);

  // â”€â”€ AI Textbook Chunks (demo/synthetic) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nðŸ¤– AI Textbook Chunks (demo)...');
  let chunkCount = 0;

  const chunkTemplates = [
    { chapter: 'Chapter 1', section: 'Introduction', page: 1, text: 'Mathematics is the study of numbers, quantities, and shapes. In Class {CLASS}, we explore fundamental concepts that build the foundation for advanced learning. Numbers can be classified as natural numbers, whole numbers, integers, rational numbers, and irrational numbers.' },
    { chapter: 'Chapter 2', section: 'Basic Operations', page: 15, text: 'Addition and subtraction are the most basic mathematical operations. When adding two numbers, we combine their values. The commutative property states that a + b = b + a. The associative property states that (a + b) + c = a + (b + c).' },
    { chapter: 'Chapter 3', section: 'Fractions', page: 30, text: 'A fraction represents a part of a whole. It consists of a numerator (top number) and denominator (bottom number). For Class {CLASS} students, understanding equivalent fractions is essential. Two fractions are equivalent if they represent the same value: 1/2 = 2/4 = 3/6.' },
    { chapter: 'Chapter 1', section: 'Living Things', page: 1, text: 'Science is the systematic study of the natural world through observation and experimentation. Living things are called organisms. All organisms share common characteristics: they grow, reproduce, respond to stimuli, and require energy.' },
    { chapter: 'Chapter 4', section: 'The Plant Kingdom', page: 45, text: 'Plants are living organisms that produce their own food through photosynthesis. The process uses sunlight, water (Hâ‚‚O), and carbon dioxide (COâ‚‚) to produce glucose and oxygen. The equation is: 6COâ‚‚ + 6Hâ‚‚O + light â†’ Câ‚†Hâ‚â‚‚Oâ‚† + 6Oâ‚‚.' },
  ];

  for (const cls of classesData.slice(0, 4)) { // chunks for classes 3-6
    for (const subj of [subjectByCode['MAT'], subjectByCode['SCI']]) {
      let doc;
      try {
        doc = await TextbookDocument.create({
          classNumber: cls.gradeNumber,
          subjectId: subj._id,
          title: `NCTB ${subj.name} Textbook â€” Class ${cls.gradeNumber}`,
          language: 'EN',
          source: 'NCTB',
          edition: '2026',
          year: 2026,
          isApproved: true,
        });
      } catch (e) {
        doc = { _id: new mongoose.Types.ObjectId() };
      }

      for (const tmpl of chunkTemplates.slice(0, 3)) {
        await TextbookChunk.create({
          documentId: doc._id,
          classNumber: cls.gradeNumber,
          subjectId: subj._id,
          chapter: tmpl.chapter,
          section: tmpl.section,
          pageNumber: tmpl.page,
          content: tmpl.text.replace(/{CLASS}/g, cls.gradeNumber) + ` [Demo content for Class ${cls.gradeNumber} ${subj.name}]`,
          embedding: [],
        });
        chunkCount++;
      }
    }
  }
  log(`${chunkCount} textbook chunks created (demo)`);

  // â”€â”€ Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\n' + 'â•'.repeat(55));
  console.log('ðŸŽ‰ SEED COMPLETE â€” Barishal Zilla School');
  console.log('â•'.repeat(55));
  console.log('\nðŸ“‹ Demo Accounts:');
  console.log('  Admin:    admin@barishal-zillaschool.edu.bd        / Admin@123');
  console.log('  Teacher:  teacher001@barishal-zillaschool.edu.bd   / Teacher@123');
  console.log('  Student:  student001@barishal-zillaschool.edu.bd   / Student@123');
  console.log('  Guardian: guardian001@barishal-zillaschool.edu.bd  / Guardian@123');
  console.log('\nðŸŒ Start servers:');
  console.log('  Backend:  cd backend && npm run dev  (port 5000)');
  console.log('  Frontend: cd frontend && npm run dev (port 3000)');
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('\nâŒ Seed failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
