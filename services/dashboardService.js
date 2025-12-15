const User = require('../models/User');
const Maid = require('../models/Maid');
const Job = require('../models/Job');
const Review = require('../models/Review');

class DashboardService {
  /**
   * Get admin dashboard statistics
   */
  static async getAdminStats() {
    const totalMaids = await Maid.countDocuments();
    const pendingApprovals = await Maid.countDocuments({ approval_status: 'pending' });
    const completedJobs = await Job.countDocuments({ status: 'completed' });
    const totalHomeowners = await User.countDocuments({ role: 'homeowner' });
    const activeJobs = await Job.countDocuments({ status: { $in: ['in_progress', 'accepted'] } });

    // Today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayJobs = await Job.find({
      status: 'completed',
      updatedAt: { $gte: today }
    });
    const todayRevenue = todayJobs.reduce((sum, job) => {
      return sum + (job.hourly_rate * (job.actual_duration || 4));
    }, 0);

    return {
      totalMaids,
      pendingApprovals,
      completedJobs,
      totalHomeowners,
      activeJobs,
      todayRevenue
    };
  }

  /**
   * Get homeowner dashboard statistics
   */
  static async getHomeownerStats(userId) {
    const activeBookings = await Job.countDocuments({
      homeowner_id: userId,
      status: { $in: ['in_progress', 'accepted', 'requested'] }
    });

    const upcomingJobs = await Job.countDocuments({
      homeowner_id: userId,
      status: { $in: ['accepted', 'requested'] },
      scheduled_datetime: { $gt: new Date() }
    });

    // Get completed jobs without reviews
    const completedJobIds = await Job.find({
      homeowner_id: userId,
      status: 'completed'
    }).select('_id');
    
    const reviewedJobIds = await Review.find({
      job_id: { $in: completedJobIds.map(j => j._id) }
    }).select('job_id');
    
    const pendingReviews = completedJobIds.length - reviewedJobIds.length;

    // Total spent
    const completedJobs = await Job.find({
      homeowner_id: userId,
      status: 'completed'
    });
    const totalSpent = completedJobs.reduce((sum, job) => {
      return sum + (job.hourly_rate * (job.actual_duration || 4));
    }, 0);

    // Favorite maids count
    const uniqueMaids = await Job.distinct('maid_id', {
      homeowner_id: userId,
      status: 'completed'
    });
    const favoriteMaids = uniqueMaids.length;

    return {
      activeBookings,
      upcomingJobs,
      pendingReviews,
      totalSpent,
      favoriteMaids
    };
  }

  /**
   * Get maid dashboard statistics
   */
  static async getMaidStats(userId) {
    const maid = await Maid.findOne({ user_id: userId });
    
    if (!maid) {
      return {
        todayJobs: 0,
        completedJobs: 0,
        totalHours: 0,
        earnings: 0,
        rating: 0,
        reviewCount: 0,
        activeJobs: 0
      };
    }

    const maidId = maid._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayJobs = await Job.countDocuments({
      maid_id: maidId,
      scheduled_datetime: { $gte: today }
    });

    const completedJobs = await Job.countDocuments({
      maid_id: maidId,
      status: 'completed'
    });

    // Total hours and earnings
    const completedJobsList = await Job.find({
      maid_id: maidId,
      status: 'completed'
    });
    
    const totalHours = completedJobsList.reduce((sum, job) => {
      return sum + (job.actual_duration || 4);
    }, 0);
    
    const earnings = completedJobsList.reduce((sum, job) => {
      return sum + (job.hourly_rate * (job.actual_duration || 4));
    }, 0);

    // Average rating
    const reviews = await Review.find({ reviewee_id: userId });
    const rating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;
    const reviewCount = reviews.length;

    const activeJobs = await Job.countDocuments({
      maid_id: maidId,
      status: { $in: ['in_progress', 'accepted', 'requested'] }
    });

    return {
      todayJobs,
      completedJobs,
      totalHours,
      earnings,
      rating,
      reviewCount,
      activeJobs
    };
  }
}

module.exports = DashboardService;