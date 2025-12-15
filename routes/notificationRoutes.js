const express = require('express');
const NotificationModel = require('../models/notificationModel');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/notifications/my - Get notifications for current user
 */
router.get('/my', auth(['admin', 'homeowner', 'maid']), async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = await NotificationModel.getForUser(userId);
    
    // Count unread
    const unreadCount = notifications.filter(n => !n.read_at).length;
    
    return res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    return res.status(500).json({ message: 'Failed to get notifications' });
  }
});

/**
 * POST /api/notifications/:id/read - Mark notification as read
 */
router.post('/:id/read', auth(['admin', 'homeowner', 'maid']), async (req, res) => {
  try {
    const { id } = req.params;
    await NotificationModel.markAsRead(id);
    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

/**
 * POST /api/notifications/read-all - Mark all notifications as read
 */
router.post('/read-all', auth(['admin', 'homeowner', 'maid']), async (req, res) => {
  try {
    const userId = req.user.userId;
    await NotificationModel.markAllAsRead(userId);
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
});

module.exports = router;
