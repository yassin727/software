const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  path: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    trim: true
  },
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
    default: null
  },
  role: {
    type: String,
    enum: ['admin', 'homeowner', 'maid', 'all'],
    default: 'all'
  },
  sort_order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create indexes
menuSchema.index({ role: 1 });
menuSchema.index({ parent_id: 1 });
menuSchema.index({ sort_order: 1 });

module.exports = mongoose.model('Menu', menuSchema);