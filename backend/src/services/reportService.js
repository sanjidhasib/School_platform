const puppeteer = require('./puppeteer');
const Student = require('../models/Student');
const SubjectGrade = require('../models/SubjectGrade');
const Mark = require('../models/Mark');
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceSession = require('../models/AttendanceSession');
const AcademicSession = require('../models/AcademicSession');

const escapeHtml = (val) => {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const attendancePercent = (records) => {
  if (!records.length) return 0;
  const present = records.filter((r) => r.status === 'PRESENT').length;
  return Math.round((present / records.length) * 100);
};

const generatePdfReport = async (student, academicSession, marks, grades, attendance) => {
  const attPct = attendancePercent(attendance);
  const totalAtt = attendance.length;
  const presentAtt = attendance.filter((r) => r.status === 'PRESENT').length;

  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #222; }
          .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; }
          .header h1 { margin: 0; color: #1e3a8a; }
          .header h2 { margin: 4px 0 0; font-weight: 400; color: #555; }
          .section { margin-top: 24px; }
          .section h3 { border-bottom: 1px solid #ccc; padding-bottom: 4px; color: #1e3a8a; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; margin-top: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
          th { background-color: #eef2ff; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px; }
          .stat { border: 1px solid #ccc; border-radius: 6px; padding: 10px; text-align: center; }
          .stat .v { font-size: 22px; font-weight: bold; color: #1e3a8a; }
          .footer { margin-top: 40px; font-size: 11px; color: #777; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Student Academic Report</h1>
          <h2>${escapeHtml(academicSession?.name || 'Academic Session')}</h2>
        </div>
        <div class="section">
          <h3>Student Details</h3>
          <div class="info-grid">
            <div><strong>Name:</strong> ${escapeHtml(student.fullName)}</div>
            <div><strong>ID:</strong> ${escapeHtml(student.studentId)}</div>
            <div><strong>Class:</strong> ${escapeHtml(student.classId?.name || '')} ${escapeHtml(student.classId?.section || '')}</div>
            <div><strong>Roll:</strong> ${escapeHtml(student.rollNumber || '-')}</div>
          </div>
        </div>
        <div class="section">
          <h3>Summary</h3>
          <div class="summary">
            <div class="stat"><div class="v">${attPct}%</div><div>Attendance</div></div>
            <div class="stat"><div class="v">${grades.length}</div><div>Graded Subjects</div></div>
            <div class="stat"><div class="v">${marks.length}</div><div>Assessments</div></div>
          </div>
          <p style="margin-top:8px; color:#555; font-size:12px;">Present ${presentAtt} / ${totalAtt} sessions</p>
        </div>
        <div class="section">
          <h3>Subject Grades</h3>
          ${grades.length ? `
            <table>
              <tr><th>Subject</th><th>Term</th><th>Grade</th><th>Percentage</th><th>Remarks</th></tr>
              ${grades.map(g => `<tr>
                <td>${escapeHtml(g.subjectId?.name || g.subjectId?.code || '-')}</td>
                <td>${escapeHtml(g.term)}</td>
                <td><strong>${escapeHtml(g.grade)}</strong></td>
                <td>${g.percentage}%</td>
                <td>${escapeHtml(g.remarks || '-')}</td>
              </tr>`).join('')}
            </table>
          ` : '<p style="color:#777;">No grades recorded yet.</p>'}
        </div>
        <div class="section">
          <h3>Assessment Marks</h3>
          ${marks.length ? `
            <table>
              <tr><th>Assessment</th><th>Subject</th><th>Obtained</th><th>Remarks</th></tr>
              ${marks.map(m => `<tr>
                <td>${escapeHtml(m.assessmentId?.title || '-')}</td>
                <td>${escapeHtml(m.assessmentId?.subjectId?.name || '-')}</td>
                <td>${m.absent ? '<em>Absent</em>' : escapeHtml(m.obtainedMarks)}</td>
                <td>${escapeHtml(m.remarks || '-')}</td>
              </tr>`).join('')}
            </table>
          ` : '<p style="color:#777;">No assessments recorded yet.</p>'}
        </div>
        <div class="footer">Generated on ${new Date().toLocaleDateString()} &mdash; Barishal Zilla School</div>
      </body>
    </html>
  `;

  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'load' });
    return await page.pdf({ format: 'A4', printBackground: true });
  } finally {
    await browser.close();
  }
};

/**
 * High-level helper: loads all data for a student and produces the PDF.
 * Matches the contract called by report controllers.
 */
const generateReport = async (studentId) => {
  const student = await Student.findById(studentId)
    .populate('classId', 'name section')
    .lean();
  if (!student) throw new Error('Student not found');

  const session = await AcademicSession.findOne({ isCurrent: true }).lean();
  const sessionFilter = session ? { academicSessionId: session._id } : {};

  const [grades, marks, attendance] = await Promise.all([
    SubjectGrade.find({ studentId, ...sessionFilter })
      .populate('subjectId', 'name code')
      .lean(),
    Mark.find({ studentId })
      .populate({ path: 'assessmentId', populate: { path: 'subjectId', select: 'name' } })
      .lean(),
    (async () => {
      const sessions = await AttendanceSession.find(sessionFilter).select('_id').lean();
      const sessionIds = sessions.map((s) => s._id);
      if (!sessionIds.length) return [];
      return AttendanceRecord.find({ studentId, attendanceSessionId: { $in: sessionIds } })
        .lean();
    })(),
  ]);

  return generatePdfReport(student, session || { name: 'All Sessions' }, marks, grades, attendance);
};

module.exports = { generatePdfReport, generateReport };
