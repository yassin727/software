const JobService = require('../services/jobService');
const NotificationService = require('../services/notificationService');
const MessageService = require('../services/messageService');
const User = require('../models/User');
const Maid = require('../models/Maid');
const Job = require('../models/Job');
const Conversation = require('../models/Conversation');

/**
 * List jobs for the current user.
 * - Homeowner: jobs where he is homeowner
 * - Maid: jobs assigned to her
 * - Admin/others: all jobs (depending on model logic)
 */
const listJobs = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const jobs = await JobService.listJobsForUser(userId, role);
    return res.json(jobs);
  } catch (err) {
    console.error('List jobs error', err);
    return res.status(500).json({ message: 'Failed to fetch jobs' });
  }
};

/**
 * Homeowner creates a job for a maid.
 * homeownerId is taken from the JWT (req.user.userId).
 */
const createJob = async (req, res) => {
  try {
    const homeownerId = req.user.userId;
    const { maidId, title, description, address, scheduledDatetime, hourlyRate, tasks, estimatedDuration } = req.body;

    // Validate required fields
    const errors = [];
    if (!maidId) errors.push({ field: 'maidId', message: 'Please select a maid' });
    if (!title) errors.push({ field: 'title', message: 'Service type is required' });
    if (!address) errors.push({ field: 'address', message: 'Address is required' });
    if (!scheduledDatetime) errors.push({ field: 'scheduledDatetime', message: 'Date and time are required' });
    if (!hourlyRate || hourlyRate <= 0) errors.push({ field: 'hourlyRate', message: 'Hourly rate is required' });

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0].message, errors });
    }

    const jobId = await JobService.createJob({
      homeownerId,
      maidId,
      title,
      description: description || '', // Optional
      address,
      scheduledDatetime,
      hourlyRate: parseFloat(hourlyRate),
      tasks: tasks || [],
      estimatedDuration: parseFloat(estimatedDuration) || 4
    });

    // Get maid's user ID for conversation and notification
    const maid = await Maid.findById(maidId).populate('user_id');
    const maidUserId = maid?.user_id?._id;

    // Send notification to maid about new job request
    try {
      const homeowner = await User.findById(homeownerId);
      
      if (maid && maid.user_id) {
        const job = await Job.findById(jobId);
        await NotificationService.notifyNewJobRequest(
          maid.user_id._id,
          job,
          homeowner?.name || 'A homeowner'
        );
      }
    } catch (notifError) {
      console.error('Failed to send job request notification:', notifError);
    }

    // AUTO-CREATE CONVERSATION between homeowner and maid
    let conversationId = null;
    if (maidUserId) {
      try {
        // Find or create conversation
        const conversation = await Conversation.findOrCreate(homeownerId, maidUserId);
        conversationId = conversation._id;
        
        // Link booking to conversation if not already linked
        if (!conversation.bookingId) {
          conversation.bookingId = jobId;
          await conversation.save();
        }

        // Create initial system message about the booking
        const job = await Job.findById(jobId);
        const scheduledDate = new Date(job.scheduled_datetime).toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        await MessageService.sendMessage(
          conversation._id,
          homeownerId,
          `📅 New booking created for ${scheduledDate}.\nService: ${title}\nAddress: ${address}\n\nYou can chat here about the booking details.`
        );
      } catch (convError) {
        console.error('Failed to create conversation for booking:', convError);
      }
    }

    return res.status(201).json({ jobId, conversationId, message: 'Booking created successfully' });
  } catch (err) {
    console.error('Create job error', err);
    return res.status(500).json({ message: 'Failed to create booking' });
  }
};

/**
 * Admin updates job status manually (e.g., cancel).
 */
const updateJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const affected = await JobService.updateJobStatus(jobId, status);
    if (!affected) {
      return res.status(404).json({ message: 'Job not found' });
    }

    return res.json({ message: 'Job status updated' });
  } catch (err) {
    console.error('Update job status error', err);
    return res.status(500).json({ message: 'Failed to update job status' });
  }
};

/**
 * Maid checks in for a job (start of work).
 */
const checkIn = async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId) {
      return res.status(400).json({ message: 'jobId is required' });
    }

    const attendanceId = await JobService.checkIn(jobId);

    // Notify homeowner that maid has arrived
    try {
      const job = await Job.findById(jobId).populate('maid_id');
      if (job && job.maid_id) {
        const maidUser = await User.findById(job.maid_id.user_id);
        await NotificationService.notifyJobStarted(
          job.homeowner_id,
          job,
          maidUser?.name || 'Your maid'
        );
      }
    } catch (notifError) {
      console.error('Failed to send check-in notification:', notifError);
    }

    return res
      .status(201)
      .json({ attendanceId, message: 'Checked in successfully' });
  } catch (err) {
    console.error('Check-in error', err);
    return res.status(500).json({ message: 'Failed to check in' });
  }
};

/**
 * Maid checks out for a job (end of work).
 */
const checkOut = async (req, res) => {
  try {
    const { attendanceId, jobId } = req.body;
    if (!attendanceId || !jobId) {
      return res
        .status(400)
        .json({ message: 'attendanceId and jobId are required' });
    }

    const attendance = await JobService.checkOut(attendanceId, jobId);
    if (!attendance) {
      return res
        .status(404)
        .json({ message: 'Attendance record not found' });
    }

    // Notify homeowner that job is completed
    try {
      const job = await Job.findById(jobId).populate('maid_id');
      if (job && job.maid_id) {
        const maidUser = await User.findById(job.maid_id.user_id);
        await NotificationService.notifyJobCompleted(
          job.homeowner_id,
          job,
          maidUser?.name || 'Your maid'
        );
        
        // Notify maid of payment (simplified - in real app would track actual payment)
        const amount = job.hourly_rate * (job.actual_duration || job.estimated_duration || 4);
        await NotificationService.notifyPaymentReceived(
          job.maid_id.user_id,
          job,
          amount
        );
      }
    } catch (notifError) {
      console.error('Failed to send checkout notification:', notifError);
    }

    return res.json({ attendance, message: 'Checked out successfully' });
  } catch (err) {
    console.error('Check-out error', err);
    return res.status(500).json({ message: 'Failed to check out' });
  }
};

/**
 * Get a single job with full details including tasks and progress
 */
const getJobDetails = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId, role } = req.user;

    const job = await Job.findById(jobId)
      .populate('homeowner_id', 'name phone photo_url email')
      .populate('maid_id')
      .lean();

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check authorization
    if (role === 'homeowner' && job.homeowner_id._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (role === 'maid') {
      const maid = await require('../models/Maid').findOne({ user_id: userId });
      if (!maid || job.maid_id._id.toString() !== maid._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    // Get attendance record if exists
    const Attendance = require('../models/Attendance');
    const attendance = await Attendance.findOne({ job_id: jobId })
      .sort({ check_in_time: -1 })
      .lean();

    return res.json({
      job: {
        id: job._id,
        title: job.title,
        description: job.description,
        address: job.address,
        scheduled_datetime: job.scheduled_datetime,
        status: job.status,
        hourly_rate: job.hourly_rate,
        estimated_duration: job.estimated_duration,
        actual_duration: job.actual_duration,
        tasks: job.tasks || [],
        progress_notes: job.progress_notes || [],
        progress_percentage: job.progress_percentage || 0,
        homeowner: {
          name: job.homeowner_id?.name,
          phone: job.homeowner_id?.phone,
          photo: job.homeowner_id?.photo_url,
          email: job.homeowner_id?.email
        },
        maid: job.maid_id ? {
          name: job.maid_id?.user_id?.name || 'Unknown',
          phone: job.maid_id?.user_id?.phone
        } : null,
        attendance: attendance ? {
          check_in_time: attendance.check_in_time,
          check_out_time: attendance.check_out_time,
          duration: attendance.duration
        } : null
      }
    });
  } catch (err) {
    console.error('Get job details error', err);
    return res.status(500).json({ message: 'Failed to get job details' });
  }
};

/**
 * Update job tasks and progress
 * Can be called by maid (to update progress) or homeowner (to edit tasks)
 */
const updateJobProgress = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { tasks, progress_percentage, progress_note } = req.body;
    const { userId, role } = req.user;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify authorization
    if (role === 'maid') {
      const maid = await require('../models/Maid').findOne({ user_id: userId });
      if (!maid) {
        return res.status(404).json({ message: 'Maid profile not found' });
      }
      if (job.maid_id.toString() !== maid._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this job' });
      }
      if (job.status !== 'in_progress') {
        return res.status(400).json({ message: 'Job must be in progress to update tasks' });
      }
    } else if (role === 'homeowner') {
      // Homeowner can edit tasks for their bookings
      if (job.homeowner_id.toString() !== userId) {
        return res.status(403).json({ message: 'Not authorized to update this job' });
      }
      // Homeowner can only update tasks, not progress percentage
      if (progress_percentage !== undefined) {
        return res.status(403).json({ message: 'Homeowners cannot update progress percentage' });
      }
    } else {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update tasks if provided
    if (tasks && Array.isArray(tasks)) {
      job.tasks = tasks;
    }

    // Update progress percentage if provided
    if (progress_percentage !== undefined) {
      job.progress_percentage = Math.max(0, Math.min(100, progress_percentage));
    }

    // Add progress note if provided
    if (progress_note && progress_note.trim()) {
      if (!job.progress_notes) {
        job.progress_notes = [];
      }
      job.progress_notes.push({
        note: progress_note.trim(),
        timestamp: new Date()
      });
    }

    await job.save();

    // Notify homeowner of progress update
    try {
      const NotificationService = require('../services/notificationService');
      await NotificationService.notifyJobProgressUpdate(
        job.homeowner_id,
        job,
        progress_percentage || job.progress_percentage
      );
    } catch (notifError) {
      console.error('Failed to send progress notification:', notifError);
    }

    return res.json({
      message: 'Job progress updated successfully',
      job: {
        tasks: job.tasks,
        progress_percentage: job.progress_percentage,
        progress_notes: job.progress_notes
      }
    });
  } catch (err) {
    console.error('Update job progress error', err);
    return res.status(500).json({ message: 'Failed to update job progress' });
  }
};

module.exports = {
  listJobs,
  createJob,
  updateJobStatus,
  checkIn,
  checkOut,
  getJobDetails,
  updateJobProgress,
};