const express = require('express');
const router = express.Router();
const c = require('../../controllers/student/attendanceController');
const { protect } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
router.get('/', protect, requireRole('STUDENT'), c.getAttendance);
module.exports = router;
