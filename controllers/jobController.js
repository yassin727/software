const JobService = require('../services/jobService');

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
    const { maidId, title, description, address, scheduledDatetime, hourlyRate } =
      req.body;

    if (!maidId || !title || !description || !address || !scheduledDatetime || !hourlyRate) {
      return res.status(400).json({
        message:
          'maidId, title, description, address, scheduledDatetime, and hourlyRate are required',
      });
    }

    const jobId = await JobService.createJob({
      homeownerId,
      maidId,
      title,
      description,
      address,
      scheduledDatetime,
      hourlyRate,
    });

    return res.status(201).json({ jobId, message: 'Job created successfully' });
  } catch (err) {
    console.error('Create job error', err);
    return res.status(500).json({ message: 'Failed to create job' });
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