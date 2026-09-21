const express = require('express');
const router = express.Router();
const c = require('../../controllers/guardian/reportsController');
const { protect } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
router.get('/:id/report', protect, requireRole('GUARDIAN'), c.download);
module.exports = router;
