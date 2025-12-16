const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // Exactly 2 participants: homeowner + maid
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  // Optional reference to the booking that created this conversation
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  // Reference to last message for preview
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate conversations between same users
// Sort participant IDs to ensure consistent ordering
conversationSchema.index({ participants: 1 });

// Index for efficient queries by participant
conversationSchema.index({ 'participants': 1, 'lastMessageAt': -1 });

// Static method to find or create conversation between two users
conversationSchema.statics.findOrCreate = async function(userId1, userId2) {
  // Sort IDs to ensure consistent lookup
  const sortedIds = [userId1, userId2].sort();
  
  let conversation = await this.findOne({
    participants: { $all: sortedIds, $size: 2 }
  });
  
  if (!conversation) {
    conversation = await this.create({
      participants: sortedIds,
      lastMessageAt: new Date()
    });
  }
  
  return conversation;
};

// Instance method to get the other participant
conversationSchema.methods.getOtherParticipant = function(currentUserId) {
  if (!currentUserId) return null;
  const currentIdStr = String(currentUserId);
  return this.participants?.find(p => p && String(p) !== currentIdStr) || null;
};

module.exports = mongoose.model('Conversation', conversationSchema);
