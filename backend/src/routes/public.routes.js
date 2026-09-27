const express = require('express');
const router = express.Router();
const c = require('../controllers/publicController');
router.get('/achievements', c.getAchievements);
router.get('/upcoming', c.getUpcoming);
router.get('/news', c.getNews);
router.get('/admission', c.getAdmission);
router.get('/school', c.getSchool);
module.exports = router;
