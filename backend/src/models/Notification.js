const mongoose = require('mongoose');
const { NOTIFICATION_TYPE } = require('../config/constants');

const notificationSchema = new mongoose.Schema({
  recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: Object.values(NOTIFICATION_TYPE), required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedEntityType: { type: String },
  relatedEntityId: { type: mongoose.Schema.Types.ObjectId },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date }
}, { timestamps: true });

notificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
