const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const mongoose = require('mongoose');

class MessageService {
  /**
   * Get all conversations for a user with unread counts
   */
  static async getConversations(userId) {
    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'name email role avatar')
    .populate('lastMessage', 'body senderId createdAt')
    .sort({ lastMessageAt: -1 })
    .lean();

    // Add unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          receiverId: userId,
          readAt: null
        });
        
        // Get the other participant
        const otherParticipant = conv.participants.find(
          p => p._id.toString() !== userId.toString()
        );
        
        return {
          id: conv._id,
          otherParticipant,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          unreadCount,
          createdAt: conv.createdAt
        };
      })
    );

    return conversationsWithUnread;
  }

  /**
   * Get or create a conversation between two users
   */
  static async getOrCreateConversation(userId, otherUserId) {
    if (userId.toString() === otherUserId.toString()) {
      throw new Error('Cannot create conversation with yourself');
    }

    const conversation = await Conversation.findOrCreate(userId, otherUserId);
    
    // Populate participants
    await conversation.populate('participants', 'name email role avatar');
    await conversation.populate('lastMessage', 'body senderId createdAt');
    
    const otherParticipant = conversation.participants.find(
      p => p._id.toString() !== userId.toString()
    );

    const unreadCount = await Message.countDocuments({
      conversationId: conversation._id,
      receiverId: userId,
      readAt: null
    });

    return {
      id: conversation._id,
      otherParticipant,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount,
      createdAt: conversation.createdAt
    };
  }

  /**
   * Get messages for a conversation with pagination
   */
  static async getMessages(conversationId, userId, { limit = 50, before = null } = {}) {
    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    const isParticipant = conversation.participants.some(
      p => p.toString() === userId.toString()
    );
    if (!isParticipant) {
      throw new Error('Not authorized to view this conversation');
    }

    const query = { conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('senderId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Return in chronological order
    return messages.reverse().map(msg => ({
      id: msg._id,
      conversationId: msg.conversationId,
      sender: msg.senderId,
      senderId: msg.senderId._id,
      receiverId: msg.receiverId,
      body: msg.body,
      attachments: msg.attachments,
      readAt: msg.readAt,
      createdAt: msg.createdAt
    }));
  }

  /**
   * Send a message
   */
  static async sendMessage(conversationId, senderId, body, attachments = []) {
    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === senderId.toString()
    );
    if (!isParticipant) {
      throw new Error('Not authorized to send messages in this conversation');
    }

    // Get receiver ID (the other participant)
    const receiverId = conversation.participants.find(
      p => p.toString() !== senderId.toString()
    );

    // Create message
    const message = await Message.create({
      conversationId,
      senderId,
      receiverId,
      body: body.trim(),
      attachments
    });

    // Update conversation's last message
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    // Populate sender info
    await message.populate('senderId', 'name avatar');

    return {
      id: message._id,
      conversationId: message.conversationId,
      sender: message.senderId,
      senderId: message.senderId._id,
      receiverId: message.receiverId,
      body: message.body,
      attachments: message.attachments,
      readAt: message.readAt,
      createdAt: message.createdAt
    };
  }

  /**
   * Mark all messages as read in a conversation for a user
   */
  static async markAsRead(conversationId, userId) {
    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === userId.toString()
    );
    if (!isParticipant) {
      throw new Error('Not authorized');
    }

    const result = await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        readAt: null
      },
      {
        readAt: new Date()
      }
    );

    return { markedAsRead: result.modifiedCount };
  }

  /**
   * Get total unread message count for a user
   */
  static async getTotalUnreadCount(userId) {
    const count = await Message.countDocuments({
      receiverId: userId,
      readAt: null
    });
    return count;
  }

  /**
   * Delete a conversation and all its messages
   */
  static async deleteConversation(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === userId.toString()
    );
    if (!isParticipant) {
      throw new Error('Not authorized');
    }

    // Delete all messages
    await Message.deleteMany({ conversationId });
    
    // Delete conversation
    await Conversation.findByIdAndDelete(conversationId);

    return { deleted: true };
  }
}

module.exports = MessageService;
