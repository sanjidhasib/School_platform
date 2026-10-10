const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// So rate limits count real visitors, not the hosting proxy.
app.set('trust proxy', env.TRUST_PROXY);

// Security & parsing
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: (env.FRONTEND_URL || 'http://localhost:3000').split(',').map((o) => o.trim()).filter(Boolean),
  credentials: true,
  // The textbook reader loads big PDFs in ranges and needs to see these.
  exposedHeaders: ['Accept-Ranges', 'Content-Range', 'Content-Length', 'Content-Disposition']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Static file serving for uploads
// Uploaded pictures (logo, carousel) are shown by the website on another
// origin, so they may be loaded cross-origin.
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.resolve(env.UPLOAD_DIR || './uploads')));

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'SchoolOS API running' }));

// Auth
app.use('/api/auth', require('./routes/auth.routes'));

// Public (no auth)
app.use('/api/public', require('./routes/public.routes'));

// Admin
app.use('/api/admin/teachers', require('./routes/admin/teachers.routes'));
app.use('/api/admin/students', require('./routes/admin/students.routes'));
app.use('/api/admin/classes', require('./routes/admin/classes.routes'));
app.use('/api/admin/subjects', require('./routes/admin/subjects.routes'));
app.use('/api/admin/assignments', require('./routes/admin/assignments.routes'));
app.use('/api/admin/timetable', require('./routes/admin/timetable.routes'));
app.use('/api/admin/notices', require('./routes/admin/notices.routes'));
app.use('/api/admin/achievements', require('./routes/admin/achievements.routes'));
app.use('/api/admin/textbooks', require('./routes/admin/textbooks.routes'));
app.use('/api/admin/dashboard', require('./routes/admin/dashboard.routes'));
app.use('/api/admin/settings', require('./routes/admin/settings.routes'));
app.use('/api/admin', require('./routes/admin/overview.routes'));

// Teacher
app.use('/api/teacher/schedule', require('./routes/teacher/schedule.routes'));
app.use('/api/teacher/classes', require('./routes/teacher/classes.routes'));
app.use('/api/teacher/assignments', require('./routes/teacher/assignments.routes'));
app.use('/api/teacher/attendance', require('./routes/teacher/attendance.routes'));
app.use('/api/teacher/homework', require('./routes/teacher/homework.routes'));
app.use('/api/teacher/results', require('./routes/teacher/results.routes'));
app.use('/api/teacher/tests', require('./routes/teacher/tests.routes'));
app.use('/api/teacher', require('./routes/teacher/grades.routes'));

// Student
app.use('/api/student/dashboard', require('./routes/student/dashboard.routes'));
app.use('/api/student/attendance', require('./routes/student/attendance.routes'));
app.use('/api/student/homework', require('./routes/student/homework.routes'));
app.use('/api/student/results', require('./routes/student/results.routes'));
app.use('/api/student/notifications', require('./routes/student/notifications.routes'));
app.use('/api/student/report', require('./routes/student/report.routes'));
app.use('/api/student/subjects', require('./routes/student/subjects.routes'));
app.use('/api/student/textbooks', require('./routes/student/textbooks.routes'));
app.use('/api/student/timetable', require('./routes/student/timetable.routes'));
app.use('/api/student/tests', require('./routes/student/tests.routes'));
app.use('/api/student/diary', require('./routes/student/diary.routes'));

// Guardian
app.use('/api/guardian/dashboard', require('./routes/guardian/dashboard.routes'));
app.use('/api/guardian/children', require('./routes/guardian/children.routes'));
app.use('/api/guardian/reports', require('./routes/guardian/reports.routes'));

// AI
app.use('/api/ai', require('./routes/ai.routes'));

// Profile (all roles)
app.use('/api/profile', require('./routes/profile.routes'));

// Global Error Handler (MUST be last)
app.use(errorHandler);

module.exports = app;
