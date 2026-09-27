const Achievement = require('../models/Achievement');
const Notice = require('../models/Notice');
const SchoolSettings = require('../models/SchoolSettings');
const Class = require('../models/Class');
const Student = require('../models/Student');
const asyncHandler = require('../utils/asyncHandler');

// Only notices meant for everyone, and only once their publish time has
// passed, may appear on the public website. Class-, role- or user-targeted
// notices stay inside the app.
const publicNotice = () => ({
  isPublished: true,
  audienceType: 'ALL',
  publishAt: { $lte: new Date() }
});

const NOTICE_FIELDS = 'title description category publishAt eventDate';

exports.getAchievements = asyncHandler(async (req, res) => {
  const achievements = await Achievement.find({ isPublished: true }).sort({ displayOrder: 1, achievementDate: -1 });
  res.json({ success: true, data: achievements });
});

exports.getUpcoming = asyncHandler(async (req, res) => {
  const notices = await Notice.find({ ...publicNotice(), eventDate: { $gte: new Date() } })
    .select(NOTICE_FIELDS)
    .sort({ eventDate: 1 })
    .limit(10);
  res.json({ success: true, data: notices });
});

/** The latest published notices, newest first — the homepage news feed. */
exports.getNews = asyncHandler(async (req, res) => {
  const notices = await Notice.find(publicNotice())
    .select(NOTICE_FIELDS)
    .sort({ publishAt: -1 })
    .limit(12);
  res.json({ success: true, data: notices });
});

/** Seats left in each class, from real enrolment against class capacity. */
exports.getAdmission = asyncHandler(async (req, res) => {
  const classes = await Class.find({ isActive: { $ne: false } })
    .select('name section gradeNumber capacity')
    .sort({ gradeNumber: 1, section: 1 });
  const data = await Promise.all(classes.map(async (c) => {
    const enrolled = await Student.countDocuments({ classId: c._id, status: 'ACTIVE' });
    const capacity = c.capacity || 40;
    return {
      _id: c._id,
      name: c.name,
      section: c.section,
      gradeNumber: c.gradeNumber,
      capacity,
      seatsLeft: Math.max(0, capacity - enrolled)
    };
  }));
  res.json({ success: true, data });
});

exports.getSchool = asyncHandler(async (req, res) => {
  // The model's fields are name/contactPhone/contactEmail; this used to
  // select schoolName/phone/email, which don't exist, so the public site
  // never received the school's phone or email.
  const settings = await SchoolSettings.findOne().select('name logoUrl address contactPhone contactEmail');
  res.json({ success: true, data: settings });
});
