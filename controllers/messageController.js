const MessageService = require('../services/messageService');
const NotificationService = require('../services/notificationService');
const mongoose = require('mongoose');

class MessageController {
  /**
   * GET /api/conversations
   * Get all conversations for the logged-in user
   */
  static async getConversations(req, res) {
    try {
      const userId = req.user.id;
      const conversations = await MessageService.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error('Error getting conversations:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * POST /api/conversations
   * Create or get existing conversation with another user
   */
  static async createConversation(req, res) {
    try {
      const userId = req.user.id;
      const { otherUserId } = req.body;

      if (!otherUserId) {
        return res.status(400).json({ message: 'otherUserId is required' });
      }

      if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
        return res.status(400).json({ message: 'Invalid otherUserId' });
      }

      const conversation = await MessageService.getOrCreateConversation(userId, otherUserId);
      res.status(201).json(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * GET /api/conversations/:id/messages
   * Get messages for a conversation with pagination
   */
  static async getMessages(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { limit = 50, before } = req.query;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }

      const messages = await MessageService.getMessages(id, userId, {
        limit: parseInt(limit),
        before
      });

      res.json(messages);
    } catch (error) {
      console.error('Error getting messages:', error);
      if (error.message === 'Conversation not found') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === 'Not authorized to view this conversation') {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * POST /api/conversations/:id/messages
   * Send a message in a conversation
   */
  static async sendMessage(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { body, attachments } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }

      if (!body || !body.trim()) {
        return res.status(400).json({ message: 'Message body is required' });
      }

      const message = await MessageService.sendMessage(id, userId, body, attachments);

      // Create notification for receiver
      try {
        await NotificationService.create({
          userId: message.receiverId,
          type: 'message',
          title: 'New Message',
          message: `${message.sender.name}: ${body.substring(0, 50)}${body.length > 50 ? '...' : ''}`,
          data: {
            conversationId: id,
            senderId: userId,
            senderName: message.sender.name
          }
        });
      } catch (notifError) {
        console.error('Failed to create message notification:', notifError);
      }

      res.status(201).json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.message === 'Conversation not found') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === 'Not authorized to send messages in this conversation') {
        return res.status(403).json({ message: error.message });
      }
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * PUT /api/conversations/:id/read
   * Mark all messages as read in a conversation
   */
  static async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }

      const result = await MessageService.markAsRead(id, userId);
      res.json(result);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      if (error.message === 'Conversation not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * GET /api/conversations/unread/count
   * Get total unread message count
   */
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const count = await MessageService.getTotalUnreadCount(userId);
      res.json({ unreadCount: count });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * DELETE /api/conversations/:id
   * Delete a conversation
   */
  static async deleteConversation(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }

      await MessageService.deleteConversation(id, userId);
      res.json({ message: 'Conversation deleted' });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      if (error.message === 'Conversation not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = MessageController;
