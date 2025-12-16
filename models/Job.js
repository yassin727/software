const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  homeowner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maid_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Maid',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  scheduled_datetime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'requested'
  },
  hourly_rate: {
    type: Number,
    required: true,
    min: 0
  },
  estimated_duration: {
    type: Number,
    default: 4.00
  },
  actual_duration: {
    type: Number,
    default: null
  },
  tasks: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completed_at: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  progress_notes: [{
    note: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  progress_percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Virtual for total amount
jobSchema.virtual('total_amount').get(function() {
  const duration = this.actual_duration || this.estimated_duration;
  return this.hourly_rate * duration;
});

// Create indexes
jobSchema.index({ homeowner_id: 1 });
jobSchema.index({ maid_id: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ scheduled_datetime: 1 });

module.exports = mongoose.model('Job', jobSchema);