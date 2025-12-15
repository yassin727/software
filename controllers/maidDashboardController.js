const User = require('../models/User');
const Maid = require('../models/Maid');
const Job = require('../models/Job');
const Review = require('../models/Review');
const NotificationService = require('../services/notificationService');

/**
 * Get maid dashboard data (stats, schedule, reviews)
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get maid profile
    const maid = await Maid.findOne({ user_id: userId });
    if (!maid) {
      return res.status(404).json({ message: 'Maid profile not found' });
    }
    
    const maidId = maid._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Start of month and week
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    // Active jobs today
    const activeJobsToday = await Job.countDocuments({
      maid_id: maidId,
      scheduled_datetime: { $gte: today, $lt: tomorrow },
      status: { $in: ['accepted', 'in_progress'] }
    });
    
    // Completed this month
    const completedThisMonth = await Job.countDocuments({
      maid_id: maidId,
      status: 'completed',
      updatedAt: { $gte: startOfMonth }
    });
    
    // Earnings this month
    const monthlyJobs = await Job.find({
      maid_id: maidId,
      status: 'completed',
      updatedAt: { $gte: startOfMonth }
    });
    const earnedThisMonth = monthlyJobs.reduce((sum, job) => {
      return sum + (job.hourly_rate * (job.actual_duration || job.estimated_duration || 4));
    }, 0);

    
    // Weekly stats
    const weeklyJobs = await Job.find({
      maid_id: maidId,
      status: 'completed',
      updatedAt: { $gte: startOfWeek }
    });
    const weeklyCompleted = weeklyJobs.length;
    const weeklyHours = weeklyJobs.reduce((sum, job) => sum + (job.actual_duration || job.estimated_duration || 4), 0);
    const weeklyEarnings = weeklyJobs.reduce((sum, job) => sum + (job.hourly_rate * (job.actual_duration || job.estimated_duration || 4)), 0);
    
    // Weekly reviews
    const weeklyReviews = await Review.countDocuments({
      reviewee_id: userId,
      createdAt: { $gte: startOfWeek }
    });
    
    // Today's schedule
    const todaySchedule = await Job.find({
      maid_id: maidId,
      scheduled_datetime: { $gte: today, $lt: tomorrow },
      status: { $ne: 'cancelled' }
    })
    .populate('homeowner_id', 'name phone photo_url')
    .sort({ scheduled_datetime: 1 });
    
    const scheduleItems = todaySchedule.map(job => ({
      id: job._id,
      title: job.title,
      clientName: job.homeowner_id?.name || 'Unknown',
      clientPhone: job.homeowner_id?.phone,
      clientPhoto: job.homeowner_id?.photo_url,
      time: new Date(job.scheduled_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      endTime: calculateEndTime(job.scheduled_datetime, job.estimated_duration || 4),
      address: job.address,
      status: job.status,
      hourlyRate: job.hourly_rate,
      estimatedDuration: job.estimated_duration || 4,
      estimatedPay: job.hourly_rate * (job.estimated_duration || 4)
    }));
    
    // Recent reviews
    const recentReviews = await Review.find({ reviewee_id: userId })
      .populate('reviewer_id', 'name photo_url')
      .sort({ createdAt: -1 })
      .limit(3);
    
    const reviews = recentReviews.map(r => ({
      id: r._id,
      clientName: r.reviewer_id?.name || 'Anonymous',
      clientPhoto: r.reviewer_id?.photo_url,
      rating: r.rating,
      comment: r.comments,
      date: formatTimeAgo(r.createdAt)
    }));
    
    // Job requests count
    const jobRequestsCount = await Job.countDocuments({
      maid_id: maidId,
      status: 'requested'
    });
    
    return res.json({
      stats: {
        activeJobsToday,
        completedThisMonth,
        averageRating: maid.average_rating || 0,
        totalReviews: maid.total_reviews || 0,
        earnedThisMonth: Math.round(earnedThisMonth * 100) / 100
      },
      weeklyStats: {
        jobsCompleted: weeklyCompleted,
        hoursWorked: weeklyHours,
        earnings: Math.round(weeklyEarnings * 100) / 100,
        newReviews: weeklyReviews
      },
      todaySchedule: scheduleItems,
      recentReviews: reviews,
      jobRequestsCount,
      isOnline: maid.is_online || false
    });
  } catch (error) {
    console.error('Error getting maid dashboard:', error);
    return res.status(500).json({ message: 'Failed to get dashboard data' });
  }
};

/**
 * Get job requests (status=requested)
 */
const getJobRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const maid = await Maid.findOne({ user_id: userId });
    if (!maid) {
      return res.status(404).json({ message: 'Maid profile not found' });
    }
    
    const requests = await Job.find({
      maid_id: maid._id,
      status: 'requested'
    })
    .populate('homeowner_id', 'name phone photo_url')
    .sort({ createdAt: -1 });
    
    const jobRequests = requests.map(job => ({
      id: job._id,
      title: job.title,
      description: job.description,
      clientName: job.homeowner_id?.name || 'Unknown',
      clientPhoto: job.homeowner_id?.photo_url,
      scheduledDate: job.scheduled_datetime,
      address: job.address,
      hourlyRate: job.hourly_rate,
      estimatedDuration: job.estimated_duration || 4,
      estimatedPay: job.hourly_rate * (job.estimated_duration || 4),
      requestedAt: job.createdAt,
      isUrgent: isUrgentRequest(job.scheduled_datetime)
    }));
    
    return res.json({
      count: jobRequests.length,
      requests: jobRequests
    });
  } catch (error) {
    console.error('Error getting job requests:', error);
    return res.status(500).json({ message: 'Failed to get job requests' });
  }
};

/**
 * Get maid's jobs (accepted/in_progress/completed)
 */
const getMyJobs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;
    
    const maid = await Maid.findOne({ user_id: userId });
    if (!maid) {
      return res.status(404).json({ message: 'Maid profile not found' });
    }
    
    const filter = { maid_id: maid._id };
    
    if (status === 'active') {
      filter.status = { $in: ['accepted', 'in_progress'] };
    } else if (status === 'upcoming') {
      filter.status = 'accepted';
      filter.scheduled_datetime = { $gt: new Date() };
    } else if (status === 'completed') {
      filter.status = 'completed';
    } else {
      filter.status = { $ne: 'cancelled' };
    }
    
    const jobs = await Job.find(filter)
      .populate('homeowner_id', 'name phone photo_url')
      .sort({ scheduled_datetime: -1 });
    
    const jobList = jobs.map(job => ({
      id: job._id,
      title: job.title,
      description: job.description,
      clientName: job.homeowner_id?.name || 'Unknown',
      clientPhone: job.homeowner_id?.phone,
      clientPhoto: job.homeowner_id?.photo_url,
      scheduledDate: job.scheduled_datetime,
      address: job.address,
      status: job.status,
      hourlyRate: job.hourly_rate,
      estimatedDuration: job.estimated_duration || 4,
      actualDuration: job.actual_duration,
      estimatedPay: job.hourly_rate * (job.estimated_duration || 4)
    }));
    
    return res.json({
      count: jobList.length,
      jobs: jobList
    });
  } catch (error) {
    console.error('Error getting maid jobs:', error);
    return res.status(500).json({ message: 'Failed to get jobs' });
  }
};


/**
 * Update maid availability (online/offline)
 */
const updateAvailability = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { isOnline } = req.body;
    
    const maid = await Maid.findOneAndUpdate(
      { user_id: userId },
      { 
        is_online: isOnline,
        last_active: new Date()
      },
      { new: true }
    );
    
    if (!maid) {
      return res.status(404).json({ message: 'Maid profile not found' });
    }
    
    return res.json({
      message: isOnline ? 'You are now online' : 'You are now offline',
      isOnline: maid.is_online
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    return res.status(500).json({ message: 'Failed to update availability' });
  }
};

/**
 * Get earnings with optional date range
 */
const getEarnings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { range } = req.query; // 'week', 'month', 'all'
    
    const maid = await Maid.findOne({ user_id: userId });
    if (!maid) {
      return res.status(404).json({ message: 'Maid profile not found' });
    }
    
    const today = new Date();
    let startDate;
    
    if (range === 'week') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
    } else if (range === 'month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else {
      startDate = new Date(0); // All time
    }
    
    const completedJobs = await Job.find({
      maid_id: maid._id,
      status: 'completed',
      updatedAt: { $gte: startDate }
    })
    .populate('homeowner_id', 'name')
    .sort({ updatedAt: -1 });
    
    const earnings = completedJobs.map(job => ({
      id: job._id,
      date: job.updatedAt,
      clientName: job.homeowner_id?.name || 'Unknown',
      service: job.title,
      duration: job.actual_duration || job.estimated_duration || 4,
      amount: job.hourly_rate * (job.actual_duration || job.estimated_duration || 4),
      status: 'paid' // Simplified - in real app would track payment status
    }));
    
    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
    const totalHours = earnings.reduce((sum, e) => sum + e.duration, 0);
    
    // Pending payments (in_progress jobs)
    const pendingJobs = await Job.find({
      maid_id: maid._id,
      status: 'in_progress'
    });
    const pendingAmount = pendingJobs.reduce((sum, job) => {
      return sum + (job.hourly_rate * (job.estimated_duration || 4));
    }, 0);
    
    return res.json({
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      totalHours,
      totalJobs: earnings.length,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      averageRate: maid.hourly_rate || 15,
      earnings
    });
  } catch (error) {
    console.error('Error getting earnings:', error);
    return res.status(500).json({ message: 'Failed to get earnings' });
  }
};

/**
 * Get maid's reviews
 */
const getReviews = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const maid = await Maid.findOne({ user_id: userId });
    if (!maid) {
      return res.status(404).json({ message: 'Maid profile not found' });
    }
    
    const reviews = await Review.find({ reviewee_id: userId })
      .populate('reviewer_id', 'name photo_url')
      .populate('job_id', 'title scheduled_datetime')
      .sort({ createdAt: -1 });
    
    // Calculate rating distribution
    const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      ratingDist[r.rating] = (ratingDist[r.rating] || 0) + 1;
    });
    
    const reviewList = reviews.map(r => ({
      id: r._id,
      clientName: r.reviewer_id?.name || 'Anonymous',
      clientPhoto: r.reviewer_id?.photo_url,
      rating: r.rating,
      comment: r.comments,
      service: r.job_id?.title || 'Service',
      date: r.createdAt
    }));
    
    return res.json({
      averageRating: maid.average_rating || 0,
      totalReviews: maid.total_reviews || reviews.length,
      ratingDistribution: ratingDist,
      reviews: reviewList
    });
  } catch (error) {
    console.error('Error getting reviews:', error);
    return res.status(500).json({ message: 'Failed to get reviews' });
  }
};

/**
 * Accept a job request
 */
const acceptJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { jobId } = req.body;
    
    const maid = await Maid.findOne({ user_id: userId });
    if (!maid) {
      return res.status(404).json({ message: 'Maid profile not found' });
    }
    
    const job = await Job.findOneAndUpdate(
      { _id: jobId, maid_id: maid._id, status: 'requested' },
      { status: 'accepted' },
      { new: true }
    );
    
    if (!job) {
      return res.status(404).json({ message: 'Job request not found' });
    }
    
    // Notify homeowner that maid accepted
    try {
      const maidUser = await User.findById(userId);
      await NotificationService.notifyJobAccepted(
        job.homeowner_id,
        job,
        maidUser?.name || 'Your maid'
      );
    } catch (notifError) {
      console.error('Failed to send accept notification:', notifError);
    }
    
    return res.json({ message: 'Job accepted successfully', job });
  } catch (error) {
    console.error('Error accepting job:', error);
    return res.status(500).json({ message: 'Failed to accept job' });
  }
};

/**
 * Decline a job request
 */
const declineJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { jobId } = req.body;
    
    const maid = await Maid.findOne({ user_id: userId });
    if (!maid) {
      return res.status(404).json({ message: 'Maid profile not found' });
    }
    
    const job = await Job.findOneAndUpdate(
      { _id: jobId, maid_id: maid._id, status: 'requested' },
      { status: 'cancelled' },
      { new: true }
    );
    
    if (!job) {
      return res.status(404).json({ message: 'Job request not found' });
    }
    
    // Notify homeowner that maid declined
    try {
      const maidUser = await User.findById(userId);
      await NotificationService.notifyJobDeclined(
        job.homeowner_id,
        job,
        maidUser?.name || 'The maid'
      );
    } catch (notifError) {
      console.error('Failed to send decline notification:', notifError);
    }
    
    return res.json({ message: 'Job declined', job });
  } catch (error) {
    console.error('Error declining job:', error);
    return res.status(500).json({ message: 'Failed to decline job' });
  }
};

// Helper functions
function calculateEndTime(startTime, duration) {
  const end = new Date(startTime);
  end.setHours(end.getHours() + duration);
  return end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const days = Math.floor(diff / 86400000);
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(date).toLocaleDateString();
}

function isUrgentRequest(scheduledDate) {
  const now = new Date();
  const scheduled = new Date(scheduledDate);
  const hoursUntil = (scheduled - now) / 3600000;
  return hoursUntil < 24 && hoursUntil > 0;
}

module.exports = {
  getDashboard,
  getJobRequests,
  getMyJobs,
  updateAvailability,
  getEarnings,
  getReviews,
  acceptJob,
  declineJob
};
