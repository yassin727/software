const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  password_hash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'homeowner', 'maid']
  },
  photo_url: {
    type: String,
    default: null
  },
  id_document_url: {
    type: String,
    default: null
  },
  selfie_url: {
    type: String,
    default: null
  },
  verification_status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verification_notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Create indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);