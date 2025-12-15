const db = require('../config/db');

class NotificationModel {
  /**
   * Create a new notification
   * @param {Object} data - Notification data
   * @param {number} data.userId - User ID to notify
   * @param {string} data.channel - Channel: 'email', 'sms', 'console'
   * @param {string} data.destination - Email address or phone number
   * @param {string} data.subject - Notification subject
   * @param {string} data.message - Notification message content
   * @returns {Promise<number>} Inserted notification ID
   */
  static async create({ userId, channel, destination, subject, message }) {
    const [result] = await db.execute(
      `INSERT INTO notifications (user_id, channel, destination, subject, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
      [userId, channel, destination, subject, message]
    );
    return result.insertId;
  }

  /**
   * Get all notifications (for admin view)
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} List of notifications
   */
  static async getAll(limit = 50) {
    const [rows] = await db.execute(
      `SELECT n.*, u.name as user_name, u.email as user_email
       FROM notifications n
       LEFT JOIN users u ON n.user_id = u.user_id
       ORDER BY n.created_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }

  /**
   * Get notifications for a specific user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} List of notifications
   */
  static async getByUserId(userId) {
    const [rows] = await db.execute(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }

  /**
   * Mark notification as sent
   * @param {number} notificationId - Notification ID
   * @returns {Promise<number>} Affected rows
   */
  static async markAsSent(notificationId) {
    const [result] = await db.execute(
      `UPDATE notifications SET status = 'sent', sent_at = NOW() WHERE notification_id = ?`,
      [notificationId]
    );
    return result.affectedRows;
  }

  /**
   * Get pending notifications (not yet sent)
   * @returns {Promise<Array>} List of pending notifications
   */
  static async getPending() {
    const [rows] = await db.execute(
      `SELECT n.*, u.name as user_name, u.email as user_email
       FROM notifications n
       LEFT JOIN users u ON n.user_id = u.user_id
       WHERE n.status = 'pending'
       ORDER BY n.created_at ASC`
    );
    return rows;
  }

  /**
   * Get notifications for a user (for display in UI)
   * @param {number} userId - User ID
   * @returns {Promise<Array>} List of notifications
   */
  static async getForUser(userId) {
    const [rows] = await db.execute(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    return rows;
  }

  /**
   * Mark notification as read
   * @param {number} notificationId - Notification ID
   * @returns {Promise<number>} Affected rows
   */
  static async markAsRead(notificationId) {
    const [result] = await db.execute(
      `UPDATE notifications SET read_at = NOW() WHERE notification_id = ?`,
      [notificationId]
    );
    return result.affectedRows;
  }

  /**
   * Mark all notifications as read for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Affected rows
   */
  static async markAllAsRead(userId) {
    const [result] = await db.execute(
      `UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL`,
      [userId]
    );
    return result.affectedRows;
  }
}

module.exports = NotificationModel;
