const express = require('express');
const router = express.Router();
const c = require('../../controllers/student/subjectsController');
const { protect } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');

router.get('/', protect, requireRole('STUDENT'), c.list);

module.exports = router;
