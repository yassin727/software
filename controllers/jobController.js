const jobModel = require('../models/jobModel');

const listJobs = async (_req, res) => {
  try {
    const jobs = await jobModel.getAllJobs();
    return res.json(jobs);
  } catch (err) {
    console.error('List jobs error', err);
    return res.status(500).json({ message: 'Failed to fetch jobs' });
  }
};

const createJob = async (req, res) => {
  try {
    const { title, description, maid_id, homeowner_id, status } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }
    const job = await jobModel.createJob({ title, description, maid_id, homeowner_id, status });
    return res.status(201).json(job);
  } catch (err) {
    console.error('Create job error', err);
    return res.status(500).json({ message: 'Failed to create job' });
  }
};

const updateJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    const updated = await jobModel.updateJobStatus(jobId, status);
    return res.json(updated);
  } catch (err) {
    console.error('Update job status error', err);
    return res.status(500).json({ message: 'Failed to update job status' });
  }
};

module.exports = {
  listJobs,
  createJob,
  updateJobStatus,
};

