const express = require('express');
const router = express.Router();
const c = require('../../controllers/admin/overviewController');
const { protect } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const admin = [protect, requireRole('ADMIN')];

router.get('/attendance', ...admin, c.listAttendance);
router.get('/homework', ...admin, c.listHomework);
router.get('/results', ...admin, c.listResults);
router.get('/notifications', ...admin, c.listNotifications);

module.exports = router;
