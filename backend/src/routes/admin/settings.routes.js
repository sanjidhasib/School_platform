const express = require('express');
const router = express.Router();
const c = require('../../controllers/admin/settingsController');
const { protect } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const admin = [protect, requireRole('ADMIN')];
router.get('/', ...admin, c.get);
router.patch('/', ...admin, c.update);
module.exports = router;
