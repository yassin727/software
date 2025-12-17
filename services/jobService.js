const Job = require('../models/Job');
const Attendance = require('../models/Attendance');
const Maid = require('../models/Maid');

class JobService {
  static async listJobsForUser(userId, role) {
    if (role === 'homeowner') {
      return await Job.find({ homeowner_id: userId })
        .populate('maid_id', 'specializations hourly_rate')
        .populate({
          path: 'maid_id',
          populate: {
            path: 'user_id',
            select: 'name email phone'
          }
        })
        .lean();
    }

    if (role === 'maid') {
      const maid = await Maid.findOne({ user_id: userId });
      if (!maid) return [];
      
      return await Job.find({ maid_id: maid._id })
        .populate('homeowner_id', 'name email phone')
        .lean();
    }

    // For admin or other roles, return all jobs
    return await Job.find({})
      .populate('homeowner_id', 'name email')
      .populate('maid_id', 'specializations')
      .lean();
  }

  static async createJob({ homeownerId, maidId, title, description, address, scheduledDatetime, hourlyRate, tasks, estimatedDuration, paymentMethod }) {
    // Convert tasks array to proper format if provided
    const formattedTasks = tasks && Array.isArray(tasks) ? tasks.map(task => ({
      name: task.name || task,
      completed: false,
      completed_at: null,
      notes: task.notes || ''
    })) : [];
    
    const job = new Job({
      homeowner_id: homeownerId,
      maid_id: maidId,
      title,
      description,
      address,
      scheduled_datetime: scheduledDatetime,
      hourly_rate: hourlyRate,
      estimated_duration: estimatedDuration || 4,
      tasks: formattedTasks,
      progress_percentage: 0,
      payment_method: paymentMethod || 'cash',
      payment_status: 'pending'
    });

    const savedJob = await job.save();
    return savedJob._id;
  }

  static async updateJobStatus(jobId, status) {
    const result = await Job.findByIdAndUpdate(
      jobId, 
      { status },
      { new: true }
    );
    return result ? 1 : 0;
  }

  static async checkIn(jobId) {
    // Update job status to in_progress
    await this.updateJobStatus(jobId, 'in_progress');
    
    // Create attendance record
    const attendance = new Attendance({
      job_id: jobId,
      check_in_time: new Date()
    });
    
    const savedAttendance = await attendance.save();
    return savedAttendance._id;
  }

  static async checkOut(attendanceId, jobId) {
    // Update attendance record with check-out time
    const attendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      { check_out_time: new Date() },
      { new: true }
    );
    
    if (attendance) {
      // Update job status to completed
      await this.updateJobStatus(jobId, 'completed');
    }
    
    return attendance;
  }
}

module.exports = JobService;