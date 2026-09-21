const express = require('express');
const router = express.Router();
const c = require('../../controllers/guardian/dashboardController');
const { protect } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
router.get('/', protect, requireRole('GUARDIAN'), c.getDashboard);
module.exports = router;
