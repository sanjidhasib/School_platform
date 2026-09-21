const mongoose = require('mongoose');
const { NOTICE_CATEGORY, NOTICE_AUDIENCE_TYPE } = require('../config/constants');

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: Object.values(NOTICE_CATEGORY), required: true },
  audienceType: { type: String, enum: Object.values(NOTICE_AUDIENCE_TYPE), required: true },
  audienceRoles: [{ type: String }],
  audienceClassIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  audienceUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  publishAt: { type: Date, required: true },
  eventDate: { type: Date },
  authorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPublished: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notice', noticeSchema);
