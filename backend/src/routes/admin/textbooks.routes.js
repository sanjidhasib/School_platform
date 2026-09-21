const express = require('express');
const router = express.Router();
const c = require('../../controllers/admin/textbookController');
const { protect } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const admin = [protect, requireRole('ADMIN')];
router.get('/', ...admin, c.list);
router.post('/', ...admin, c.register);
module.exports = router;
