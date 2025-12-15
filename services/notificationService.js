const NotificationModel = require('../models/notificationModel');
const crypto = require('crypto');

/**
 * NotificationService handles sending notifications via various channels.
 * In development mode, it logs to console and stores in DB.
 * In production, it would integrate with email/SMS services.
 */
class NotificationService {
  /**
   * Generate a temporary password for maid approval
   * @returns {string} Random password
   */
  static generateTempPassword() {
    return crypto.randomBytes(4).toString('hex'); // 8 character password
  }

  /**
   * Send maid approval notification
   * @param {Object} maid - Maid data with user info
   * @param {string} tempPassword - Temporary password (if applicable)
   */
  static async sendMaidApprovalNotification(maid, tempPassword = null) {
    const subject = 'MaidTrack - Your Account Has Been Approved!';
    const message = tempPassword
      ? `Congratulations ${maid.name}!

Your MaidTrack account has been approved. You can now login using:

Email: ${maid.email}
Temporary Password: ${tempPassword}

Please change your password after logging in.

Welcome to MaidTrack!`
      : `Congratulations ${maid.name}!

Your MaidTrack account has been approved. You can now login with your registered credentials.

Welcome to MaidTrack!`;

    // Log to console (dev fallback)
    console.log('='.repeat(60));
    console.log('📧 NOTIFICATION - MAID APPROVAL');
    console.log('='.repeat(60));
    console.log(`To: ${maid.email}`);
    console.log(`Subject: ${subject}`);
    console.log('-'.repeat(60));
    console.log(message);
    console.log('='.repeat(60));

    // Store in database
    try {
      const notificationId = await NotificationModel.create({
        userId: maid.user_id,
        channel: 'email',
        destination: maid.email,
        subject: subject,
        message: message
      });

      // In production, you would actually send the email here
      // For now, just mark as sent since we logged it
      await NotificationModel.markAsSent(notificationId);

      return { success: true, notificationId };
    } catch (error) {
      console.error('Failed to store notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send maid rejection notification
   * @param {Object} maid - Maid data with user info
   * @param {string} reason - Rejection reason
   */
  static async sendMaidRejectionNotification(maid, reason = '') {
    const subject = 'MaidTrack - Account Application Update';
    const message = `Dear ${maid.name},

We regret to inform you that your MaidTrack account application was not approved at this time.

${reason ? `Reason: ${reason}

` : ''}If you believe this was a mistake or have questions, please contact our support team.

Best regards,
MaidTrack Team`;

    // Log to console (dev fallback)
    console.log('='.repeat(60));
    console.log('📧 NOTIFICATION - MAID REJECTION');
    console.log('='.repeat(60));
    console.log(`To: ${maid.email}`);
    console.log(`Subject: ${subject}`);
    console.log('-'.repeat(60));
    console.log(message);
    console.log('='.repeat(60));

    // Store in database
    try {
      const notificationId = await NotificationModel.create({
        userId: maid.user_id,
        channel: 'email',
        destination: maid.email,
        subject: subject,
        message: message
      });

      await NotificationModel.markAsSent(notificationId);

      return { success: true, notificationId };
    } catch (error) {
      console.error('Failed to store notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all notifications (for admin endpoint)
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} List of notifications
   */
  static async getAllNotifications(limit = 50) {
    return NotificationModel.getAll(limit);
  }

  /**
   * Get pending notifications
   * @returns {Promise<Array>} List of pending notifications
   */
  static async getPendingNotifications() {
    return NotificationModel.getPending();
  }
}

module.exports = NotificationService;
