const express = require('express');
const router = express.Router();
const c = require('../../controllers/student/homeworkController');
const { protect } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const student = [protect, requireRole('STUDENT')];
router.get('/', ...student, c.list);
router.post('/:id/submit', ...student, c.submit);
module.exports = router;
