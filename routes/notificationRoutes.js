const express = require('express');
const NotificationService = require('../services/notificationService');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/notifications - Get notifications for current user (paginated)
 */
router.get('/', auth(['admin', 'homeowner', 'maid']), async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';
    
    const result = await NotificationService.getForUser(userId, { page, limit, unreadOnly });
    
    return res.json(result);
  } catch (error) {
    console.error('Error getting notifications:', error);
    return res.status(500).json({ message: 'Failed to get notifications' });
  }
});

/**
 * GET /api/notifications/unread-count - Get unread notification count
 */
router.get('/unread-count', auth(['admin', 'homeowner', 'maid']), async (req, res) => {
  try {
    const userId = req.user.userId;
    const unreadCount = await NotificationService.getUnreadCount(userId);
    return res.json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return res.status(500).json({ message: 'Failed to get unread count' });
  }
});

/**
 * GET /api/notifications/stream - SSE endpoint for real-time notifications
 */
router.get('/stream', auth(['admin', 'homeowner', 'maid']), async (req, res) => {
  const userId = req.user.userId;
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);
  
  // Send initial unread count
  const unreadCount = await NotificationService.getUnreadCount(userId);
  res.write(`data: ${JSON.stringify({ type: 'unread_count', unreadCount })}\n\n`);
  
  // Register client for real-time updates
  NotificationService.registerSSEClient(userId, res);
  
  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);
  
  // Cleanup on close
  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

/**
 * PUT /api/notifications/:id/read - Mark notification as read
 */
router.put('/:id/read', auth(['admin', 'homeowner', 'maid']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const notification = await NotificationService.markAsRead(id, userId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

/**
 * PUT /api/notifications/read-all - Mark all notifications as read
 */
router.put('/read-all', auth(['admin', 'homeowner', 'maid']), async (req, res) => {
  try {
    const userId = req.user.userId;
    await NotificationService.markAllAsRead(userId);
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
});

// Legacy endpoints for backward compatibility
router.get('/my', auth(['admin', 'homeowner', 'maid']), async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await NotificationService.getForUser(userId, { limit: 50 });
    return res.json(result);
  } catch (error) {
    console.error('Error getting notifications:', error);
    return res.status(500).json({ message: 'Failed to get notifications' });
  }
});

router.post('/:id/read', auth(['admin', 'homeowner', 'maid']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    await NotificationService.markAsRead(id, userId);
    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

router.post('/read-all', auth(['admin', 'homeowner', 'maid']), async (req, res) => {
  try {
    const userId = req.user.userId;
    await NotificationService.markAllAsRead(userId);
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
});

module.exports = router;
