const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  homeowner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maid_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  method: {
    type: String,
    enum: ['card', 'apple_pay', 'cash'],
    required: true
  },
  provider: {
    type: String,
    enum: ['stripe', 'cash'],
    default: 'cash'
  },
  stripe_payment_intent_id: {
    type: String,
    default: null
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paid_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ booking_id: 1 });
paymentSchema.index({ homeowner_id: 1 });
paymentSchema.index({ maid_id: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
