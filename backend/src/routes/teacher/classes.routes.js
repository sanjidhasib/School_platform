const express = require('express');
const router = express.Router();
const c = require('../../controllers/teacher/classesController');
const { protect } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const teacher = [protect, requireRole('TEACHER')];

router.get('/:classId/students', ...teacher, c.getClassStudents);

module.exports = router;
