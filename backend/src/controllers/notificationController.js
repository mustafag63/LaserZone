const Notification = require('../models/Notification');

// GET /api/notifications
const list = async (req, res) => {
  try {
    const notifications = await Notification.findByUser(req.user.id);
    const unread = notifications.filter(n => !n.isRead).length;
    return res.json({ notifications, unread });
  } catch (err) {
    console.error('[listNotifications]', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// PUT /api/notifications/read-all
const markAllRead = async (req, res) => {
  try {
    await Notification.markAllRead(req.user.id);
    return res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('[markAllRead]', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// PUT /api/notifications/:id/read
const markRead = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid notification ID.' });
    await Notification.markRead(id, req.user.id);
    return res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    console.error('[markRead]', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { list, markAllRead, markRead };
