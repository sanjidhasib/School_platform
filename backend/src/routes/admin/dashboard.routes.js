const express = require('express');
const router = express.Router();
const c = require('../../controllers/admin/dashboardController');
const { protect } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
router.get('/', protect, requireRole('ADMIN'), c.getDashboard);
module.exports = router;
