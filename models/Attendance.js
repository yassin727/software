const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  check_in_time: {
    type: Date,
    required: true,
    default: Date.now
  },
  check_out_time: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Virtual for duration in minutes
attendanceSchema.virtual('duration_minutes').get(function() {
  if (!this.check_out_time) return null;
  return Math.floor((this.check_out_time - this.check_in_time) / (1000 * 60));
});

// Create indexes
attendanceSchema.index({ job_id: 1 });
attendanceSchema.index({ check_in_time: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);