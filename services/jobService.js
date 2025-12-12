const JobModel = require('../models/jobModel');

class JobService {
  static async listJobsForUser(userId, role) {
    return JobModel.listForUser(userId, role);
  }

  static async createJob({ homeownerId, maidId, title, description, address, scheduledDatetime, hourlyRate }) {
    return JobModel.create({
      homeownerId,
      maidId,
      title,
      description,
      address,
      scheduledDatetime,
      hourlyRate,
    });
  }

  static async updateStatus(jobId, status) {
    return JobModel.updateStatus(jobId, status);
  }
}

module.exports = JobService;