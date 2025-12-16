const Notification = require('../models/Notification');
const crypto = require('crypto');

// In-memory store for SSE clients (for real-time notifications)
const sseClients = new Map();

/**
 * NotificationService handles creating and managing in-app notifications.
 * Supports real-time delivery via SSE (Server-Sent Events).
 */
class NotificationService {
  
  // ============================================================
  // SSE Client Management (Real-time)
  // ============================================================
  
  /**
   * Register an SSE client for real-time notifications
   * @param {string} userId - User ID
   * @param {Object} res - Express response object
   */
  static registerSSEClient(userId, res) {
    if (!sseClients.has(userId)) {
      sseClients.set(userId, new Set());
    }
    sseClients.get(userId).add(res);
    
    // Remove client on connection close
    res.on('close', () => {
      const clients = sseClients.get(userId);
      if (clients) {
        clients.delete(res);
        if (clients.size === 0) {
          sseClients.delete(userId);
        }
      }
    });
  }
  
  /**
   * Send real-time notification to connected clients
   * @param {string} userId - User ID
   * @param {Object} notification - Notification data
   */
  static sendToClient(userId, notification) {
    const clients = sseClients.get(userId.toString());
    if (clients) {
      const data = JSON.stringify(notification);
      clients.forEach(client => {
        client.write(`data: ${data}\n\n`);
      });
    }
  }
  
  // ============================================================
  // Core Notification Methods
  // ============================================================
  
  /**
   * Create and store a notification
   * @param {Object} params - Notification parameters
   * @returns {Promise<Object>} Created notification
   */
  static async create({ userId, type, title, message, data = {} }) {
    try {
      const notification = await Notification.create({
        user_id: userId,
        type,
        title,
        message,
        data,
        is_read: false
      });
      
      // Send real-time update
      this.sendToClient(userId, {
        type: 'new_notification',
        notification: {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          is_read: false,
          createdAt: notification.createdAt
        }
      });
      
      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }
  
  /**
   * Get notifications for a user with pagination
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Notifications and counts
   */
  static async getForUser(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const query = { user_id: userId };
    if (unreadOnly) {
      query.is_read = false;
    }
    
    const skip = (page - 1) * limit;
    
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ user_id: userId, is_read: false })
    ]);
    
    return {
      notifications,
      unreadCount,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  /**
   * Get unread count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Unread count
   */
  static async getUnreadCount(userId) {
    return Notification.countDocuments({ user_id: userId, is_read: false });
  }
  
  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for verification)
   */
  static async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user_id: userId },
      { is_read: true, read_at: new Date() },
      { new: true }
    );
    
    if (notification) {
      // Send updated unread count
      const unreadCount = await this.getUnreadCount(userId);
      this.sendToClient(userId, { type: 'unread_count', unreadCount });
    }
    
    return notification;
  }
  
  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   */
  static async markAllAsRead(userId) {
    await Notification.updateMany(
      { user_id: userId, is_read: false },
      { is_read: true, read_at: new Date() }
    );
    
    // Send updated unread count
    this.sendToClient(userId, { type: 'unread_count', unreadCount: 0 });
  }
  
  // ============================================================
  // Notification Triggers
  // ============================================================
  
  /**
   * Notify maid of new job request
   */
  static async notifyNewJobRequest(maidUserId, job, homeownerName) {
    return this.create({
      userId: maidUserId,
      type: 'job_request',
      title: 'New Job Request',
      message: `${homeownerName} has requested your service for "${job.title}"`,
      data: {
        job_id: job._id,
        homeowner_id: job.homeowner_id
      }
    });
  }
  
  /**
   * Notify homeowner that maid accepted job
   */
  static async notifyJobAccepted(homeownerUserId, job, maidName) {
    return this.create({
      userId: homeownerUserId,
      type: 'job_accepted',
      title: 'Job Accepted',
      message: `${maidName} has accepted your booking for "${job.title}"`,
      data: { job_id: job._id }
    });
  }
  
  /**
   * Notify homeowner that maid declined job
   */
  static async notifyJobDeclined(homeownerUserId, job, maidName) {
    return this.create({
      userId: homeownerUserId,
      type: 'job_declined',
      title: 'Job Declined',
      message: `${maidName} has declined your booking for "${job.title}". Please book another maid.`,
      data: { job_id: job._id }
    });
  }
  
  /**
   * Notify homeowner that maid has started (checked in)
   */
  static async notifyJobStarted(homeownerUserId, job, maidName) {
    return this.create({
      userId: homeownerUserId,
      type: 'job_started',
      title: 'Maid Has Arrived',
      message: `${maidName} has checked in and started working on "${job.title}"`,
      data: { job_id: job._id }
    });
  }
  
  /**
   * Notify homeowner that job is completed
   */
  static async notifyJobCompleted(homeownerUserId, job, maidName) {
    return this.create({
      userId: homeownerUserId,
      type: 'job_completed',
      title: 'Job Completed',
      message: `${maidName} has completed "${job.title}". Please leave a review!`,
      data: { job_id: job._id }
    });
  }
  
  /**
   * Notify relevant party of job cancellation
   */
  static async notifyJobCancelled(userId, job, cancelledBy) {
    return this.create({
      userId: userId,
      type: 'job_cancelled',
      title: 'Booking Cancelled',
      message: `The booking "${job.title}" has been cancelled by ${cancelledBy}`,
      data: { job_id: job._id }
    });
  }
  
  /**
   * Notify maid of new review
   */
  static async notifyNewReview(maidUserId, review, homeownerName, jobTitle) {
    return this.create({
      userId: maidUserId,
      type: 'new_review',
      title: 'New Review Received',
      message: `${homeownerName} left a ${review.rating}-star review for "${jobTitle}"`,
      data: {
        review_id: review._id,
        job_id: review.job_id,
        rating: review.rating
      }
    });
  }
  
  /**
   * Notify maid of payment received
   */
  static async notifyPaymentReceived(maidUserId, job, amount) {
    return this.create({
      userId: maidUserId,
      type: 'payment_received',
      title: 'Payment Received',
      message: `You received $${amount.toFixed(2)} for "${job.title}"`,
      data: {
        job_id: job._id,
        amount: amount
      }
    });
  }
  
  /**
   * Notify maid of account approval
   */
  static async notifyMaidApproved(maidUserId, maidName) {
    return this.create({
      userId: maidUserId,
      type: 'maid_approved',
      title: 'Account Approved!',
      message: `Congratulations ${maidName}! Your account has been approved. You can now receive job requests.`,
      data: {}
    });
  }
  
  /**
   * Notify maid of account rejection
   */
  static async notifyMaidRejected(maidUserId, maidName, reason = '') {
    return this.create({
      userId: maidUserId,
      type: 'maid_rejected',
      title: 'Account Application Update',
      message: reason 
        ? `Dear ${maidName}, your application was not approved. Reason: ${reason}`
        : `Dear ${maidName}, your application was not approved at this time.`,
      data: { reason }
    });
  }
  
  // ============================================================
  // Email + In-App Notification Methods
  // ============================================================
  
  static generateTempPassword() {
    return crypto.randomBytes(4).toString('hex');
  }
  
  /**
   * Send maid approval notification (in-app + email)
   */
  static async sendMaidApprovalNotification(maid) {
    // Create in-app notification
    await this.notifyMaidApproved(maid.user_id, maid.name);
    
    // Send email notification
    const EmailService = require('./emailService');
    const emailResult = await EmailService.sendMaidApprovalEmail(maid);
    
    console.log('📧 MAID APPROVAL:', maid.email, emailResult.success ? '✅' : '❌');
    return emailResult;
  }
  
  /**
   * Send maid rejection notification (in-app + email)
   */
  static async sendMaidRejectionNotification(maid, reason = '') {
    // Create in-app notification
    await this.notifyMaidRejected(maid.user_id, maid.name, reason);
    
    // Send email notification
    const EmailService = require('./emailService');
    const emailResult = await EmailService.sendMaidRejectionEmail(maid, reason);
    
    console.log('📧 MAID REJECTION:', maid.email, emailResult.success ? '✅' : '❌');
    return emailResult;
  }
  
  static async getAllNotifications(limit = 50) {
    return Notification.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user_id', 'name email');
  }
  
  static async getPendingNotifications() {
    return Notification.find({ is_read: false })
      .sort({ createdAt: -1 })
      .populate('user_id', 'name email');
  }
  
  /**
   * Notify homeowner of job progress update
   */
  static async notifyJobProgressUpdate(homeownerId, job, progressPercent) {
    return this.create({
      userId: homeownerId,
      type: 'job_progress',
      title: 'Job Progress Update',
      message: `${job.title} is now ${progressPercent}% complete`,
      data: {
        jobId: job._id,
        progressPercent,
        jobTitle: job.title
      }
    });
  }
}

module.exports = NotificationService;
