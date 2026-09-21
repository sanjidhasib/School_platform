const Notification = require('../../models/Notification');
const asyncHandler = require('../../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const { isRead } = req.query;
  const filter = { recipientUserId: req.user._id };
  if (isRead !== undefined) filter.isRead = isRead === 'true';
  const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(100);
  const unreadCount = await Notification.countDocuments({ recipientUserId: req.user._id, isRead: false });
  res.json({ success: true, data: notifications, unreadCount });
});
exports.markRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientUserId: req.user._id },
    { isRead: true, readAt: new Date() }, { new: true }
  );
  res.json({ success: true, data: notif });
});
exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipientUserId: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
  res.json({ success: true, message: 'All marked as read' });
});
