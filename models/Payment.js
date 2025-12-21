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
    enum: ['stripe', 'apple_pay', 'cash'],
    default: 'cash'
  },
  stripe_payment_intent_id: {
    type: String,
    default: null
  },
  // Total amount paid by homeowner
  amount: {
    type: Number,
    required: true
  },
  // Platform commission (percentage of amount)
  commission_rate: {
    type: Number,
    default: 15, // 15% default commission
    min: 0,
    max: 100
  },
  // Commission amount (calculated)
  commission_amount: {
    type: Number,
    default: 0
  },
  // Amount that goes to maid (amount - commission)
  maid_earnings: {
    type: Number,
    default: 0
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
  },
  // Track if commission has been settled to admin
  commission_settled: {
    type: Boolean,
    default: false
  },
  commission_settled_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Pre-save hook to calculate commission and maid earnings
paymentSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isNew) {
    this.commission_amount = Math.round((this.amount * this.commission_rate / 100) * 100) / 100;
    this.maid_earnings = Math.round((this.amount - this.commission_amount) * 100) / 100;
  }
  next();
});

// Indexes
paymentSchema.index({ booking_id: 1 });
paymentSchema.index({ homeowner_id: 1 });
paymentSchema.index({ maid_id: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ commission_settled: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
