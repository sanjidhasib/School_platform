const express = require('express');
const router = express.Router();
const c = require('../../controllers/student/resultsController');
const { protect } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
router.get('/', protect, requireRole('STUDENT'), c.getResults);
module.exports = router;
