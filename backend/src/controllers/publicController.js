const Achievement = require('../models/Achievement');
const Notice = require('../models/Notice');
const SchoolSettings = require('../models/SchoolSettings');
const asyncHandler = require('../utils/asyncHandler');

exports.getAchievements = asyncHandler(async (req, res) => {
  const achievements = await Achievement.find({ isPublished: true }).sort({ displayOrder: 1, achievementDate: -1 });
  res.json({ success: true, data: achievements });
});
exports.getUpcoming = asyncHandler(async (req, res) => {
  const notices = await Notice.find({ isPublished: true, eventDate: { $gte: new Date() } }).sort({ eventDate: 1 }).limit(10);
  res.json({ success: true, data: notices });
});
exports.getSchool = asyncHandler(async (req, res) => {
  const settings = await SchoolSettings.findOne().select('schoolName logoUrl address phone email');
  res.json({ success: true, data: settings });
});
