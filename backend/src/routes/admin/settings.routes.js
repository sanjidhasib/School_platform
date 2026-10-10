const express = require('express');
const router = express.Router();
const c = require('../../controllers/admin/settingsController');
const b = require('../../controllers/admin/brandingController');
const { protect } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const admin = [protect, requireRole('ADMIN')];
router.get('/', ...admin, c.get);
router.patch('/', ...admin, c.update);
// Website pictures: logo and carousel slides
router.post('/media', ...admin, b.upload, b.set);
router.delete('/media/:target', ...admin, b.reset);
module.exports = router;
