const express = require('express');
const router = express.Router();
const c = require('../../controllers/teacher/classesController');
const { protect } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');

router.get('/', protect, requireRole('TEACHER'), c.listAssignments);

module.exports = router;
