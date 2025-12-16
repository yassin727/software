const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  body: {
    type: String,
    required: [true, 'Message body is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file']
    },
    url: String,
    name: String
  }],
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for efficient message retrieval by conversation
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Index for unread messages count
messageSchema.index({ receiverId: 1, readAt: 1 });

// Index for pagination
messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
