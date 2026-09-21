const express = require('express');
const router = express.Router();
const c = require('../controllers/publicController');
router.get('/achievements', c.getAchievements);
router.get('/upcoming', c.getUpcoming);
router.get('/school', c.getSchool);
module.exports = router;
