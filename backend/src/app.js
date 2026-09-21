const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security & parsing
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

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
app.use('/api/teacher/attendance', require('./routes/teacher/attendance.routes'));
app.use('/api/teacher/homework', require('./routes/teacher/homework.routes'));
app.use('/api/teacher/results', require('./routes/teacher/results.routes'));

// Student
app.use('/api/student/dashboard', require('./routes/student/dashboard.routes'));
app.use('/api/student/attendance', require('./routes/student/attendance.routes'));
app.use('/api/student/homework', require('./routes/student/homework.routes'));
app.use('/api/student/results', require('./routes/student/results.routes'));
app.use('/api/student/notifications', require('./routes/student/notifications.routes'));
app.use('/api/student/report', require('./routes/student/report.routes'));

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
