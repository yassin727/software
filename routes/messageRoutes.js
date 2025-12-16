const express = require('express');
const MessageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
// Accessible by all roles: admin, homeowner, maid

// GET /api/conversations - Get all conversations for logged-in user
router.get('/', auth(), MessageController.getConversations);

// GET /api/conversations/unread/count - Get total unread count
// Note: This must come before /:id to avoid matching "unread" as an ID
router.get('/unread/count', auth(), MessageController.getUnreadCount);

// POST /api/conversations - Create or get existing conversation
router.post('/', auth(), MessageController.createConversation);

// GET /api/conversations/by-booking/:bookingId - Get conversation for a booking
router.get('/by-booking/:bookingId', auth(), MessageController.getConversationByBooking);

// GET /api/conversations/:id/messages - Get messages in a conversation
router.get('/:id/messages', auth(), MessageController.getMessages);

// POST /api/conversations/:id/messages - Send a message
router.post('/:id/messages', auth(), MessageController.sendMessage);

// PUT /api/conversations/:id/read - Mark messages as read
router.put('/:id/read', auth(), MessageController.markAsRead);

// DELETE /api/conversations/:id - Delete a conversation
router.delete('/:id', auth(), MessageController.deleteConversation);

module.exports = router;
