const Notification = require("../models/Notification");

async function getNotifications(req, res) {
  try {
    const notifs = await Notification.find({ recipientId: req.session.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
}

async function getNotificationCount(req, res) {
  try {
    const count = await Notification.countDocuments({
      recipientId: req.session.user.id,
      read: false,
    });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications count" });
  }
}

async function markNotificationRead(req, res) {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.session.user.id },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to mark notification as read" });
  }
}

module.exports = {
  getNotifications,
  getNotificationCount,
  markNotificationRead,
};
