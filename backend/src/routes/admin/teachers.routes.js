const express = require('express');
const {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher
} = require('../../controllers/admin/teacherController');
const { protect } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { ROLES } = require('../../config/constants');
const { teacherValidator } = require('../../validators/teacher.validators');

const router = express.Router();

router.use(protect, requireRole(ROLES.ADMIN));

router.get('/', getTeachers);
router.post('/', teacherValidator, createTeacher);
router.get('/:id', getTeacher);
router.patch('/:id', updateTeacher);
router.delete('/:id', deleteTeacher);

module.exports = router;
