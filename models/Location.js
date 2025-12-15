const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  maid_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Maid',
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Create indexes
locationSchema.index({ maid_id: 1 });
locationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Location', locationSchema);