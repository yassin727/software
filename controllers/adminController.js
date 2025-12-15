const NotificationService = require('../services/notificationService');
const db = require('../config/db');

/**
 * Admin: Get all notifications
 */
const getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const notifications = await NotificationService.getAllNotifications(limit);
    return res.json({ 
      count: notifications.length,
      notifications 
    });
  } catch (err) {
    console.error('Get notifications error', err);
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

/**
 * Admin: Get pending notifications
 */
const getPendingNotifications = async (req, res) => {
  try {
    const notifications = await NotificationService.getPendingNotifications();
    return res.json({ 
      count: notifications.length,
      notifications 
    });
  } catch (err) {
    console.error('Get pending notifications error', err);
    return res.status(500).json({ message: 'Failed to fetch pending notifications' });
  }
};

/**
 * Admin: Get pending verifications
 */
const getPendingVerifications = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT user_id, name, email, role, id_document_url, selfie_url, verification_status, created_at 
       FROM users 
       WHERE verification_status = 'pending'
       ORDER BY created_at DESC`
    );
    
    return res.json(rows);
  } catch (error) {
    console.error('Error getting pending verifications:', error);
    return res.status(500).json({ message: 'Failed to get pending verifications' });
  }
};

/**
 * Admin: Process verification (approve/reject)
 */
const processVerification = async (req, res) => {
  try {
    const { userId, action, reason } = req.body;
    
    if (!userId || !action) {
      return res.status(400).json({ message: 'userId and action are required' });
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be approve or reject' });
    }
    
    const status = action === 'approve' ? 'verified' : 'rejected';
    
    await db.execute(
      'UPDATE users SET verification_status = ?, verification_notes = ? WHERE user_id = ?',
      [status, reason || null, userId]
    );
    
    return res.json({ 
      message: `User verification ${action}d successfully`,
      status: status
    });
  } catch (error) {
    console.error('Error processing verification:', error);
    return res.status(500).json({ message: 'Failed to process verification' });
  }
};

module.exports = {
  getNotifications,
  getPendingNotifications,
  getPendingVerifications,
  processVerification
};
