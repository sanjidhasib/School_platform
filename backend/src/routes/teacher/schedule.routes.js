const express = require('express');
const router = express.Router();
const c = require('../../controllers/teacher/dashboardController');
const { protect } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
router.get('/today', protect, requireRole('TEACHER'), c.getTodaySchedule);
router.get('/week', protect, requireRole('TEACHER'), c.getWeekSchedule);
module.exports = router;
