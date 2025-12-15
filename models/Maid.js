const mongoose = require('mongoose');

const maidSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approval_status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejection_reason: {
    type: String,
    default: null
  },
  specializations: {
    type: String,
    default: 'General Cleaning'
  },
  experience_years: {
    type: Number,
    default: 0
  },
  hourly_rate: {
    type: Number,
    default: 15.00
  },
  availability_schedule: {
    type: mongoose.Schema.Types.Mixed, // JSON object
    default: {}
  },
  average_rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  total_reviews: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    default: 'Sector 1'
  },
  is_online: {
    type: Boolean,
    default: false
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  bio: {
    type: String,
    default: ''
  },
  last_active: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes
maidSchema.index({ user_id: 1 });
maidSchema.index({ approval_status: 1 });
maidSchema.index({ average_rating: -1 });

module.exports = mongoose.model('Maid', maidSchema);