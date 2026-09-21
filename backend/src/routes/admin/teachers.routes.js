const express = require('express');
const { getTeachers, createTeacher } = require('../../controllers/admin/teacherController');
const { protect } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { ROLES } = require('../../config/constants');
const { teacherValidator } = require('../../validators/teacher.validators');

const router = express.Router();

router.use(protect, requireRole(ROLES.ADMIN));

router.get('/', getTeachers);
router.post('/', teacherValidator, createTeacher);

module.exports = router;
