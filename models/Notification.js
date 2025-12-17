const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'job_request',       // New job assigned to maid
      'job_accepted',      // Maid accepted job
      'job_declined',      // Maid declined job
      'job_started',       // Maid checked in
      'job_completed',     // Job completed
      'job_cancelled',     // Job cancelled
      'job_progress',      // Job progress update
      'new_review',        // New review received
      'payment_received',  // Payment marked as paid
      'payment_required',  // Payment required from homeowner
      'maid_approved',     // Maid account approved
      'maid_rejected',     // Maid account rejected
      'system'             // System notification
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    maid_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Maid' },
    review_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
    homeowner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    extra: mongoose.Schema.Types.Mixed
  },
  is_read: {
    type: Boolean,
    default: false
  },
  read_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ user_id: 1, is_read: 1 });
notificationSchema.index({ user_id: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
