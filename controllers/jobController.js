const JobService = require('../services/jobService');
const NotificationService = require('../services/notificationService');
const User = require('../models/User');
const Maid = require('../models/Maid');
const Job = require('../models/Job');

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
    const { maidId, title, description, address, scheduledDatetime, hourlyRate } = req.body;

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
    });

    // Send notification to maid about new job request
    try {
      const [homeowner, maid] = await Promise.all([
        User.findById(homeownerId),
        Maid.findById(maidId).populate('user_id')
      ]);
      
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

    return res.status(201).json({ jobId, message: 'Booking created successfully' });
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

module.exports = {
  listJobs,
  createJob,
  updateJobStatus,
  checkIn,
  checkOut,
};