const db = require('../config/db');

class DashboardService {
  /**
   * Get admin dashboard statistics
   */
  static async getAdminStats() {
    // Total maids
    const [maidsResult] = await db.execute(
      'SELECT COUNT(*) as count FROM maids'
    );
    const totalMaids = maidsResult[0].count;

    // Pending approvals
    const [pendingResult] = await db.execute(
      "SELECT COUNT(*) as count FROM maids WHERE approval_status = 'pending'"
    );
    const pendingApprovals = pendingResult[0].count;

    // Completed jobs
    const [jobsResult] = await db.execute(
      "SELECT COUNT(*) as count FROM jobs WHERE status = 'completed'"
    );
    const completedJobs = jobsResult[0].count;

    // Total homeowners
    const [homeownersResult] = await db.execute(
      "SELECT COUNT(*) as count FROM users WHERE role = 'homeowner'"
    );
    const totalHomeowners = homeownersResult[0].count;

    // Active jobs
    const [activeJobsResult] = await db.execute(
      "SELECT COUNT(*) as count FROM jobs WHERE status IN ('in_progress', 'accepted')"
    );
    const activeJobs = activeJobsResult[0].count;

    // Today's revenue (sum of completed jobs today)
    const [revenueResult] = await db.execute(
      `SELECT COALESCE(SUM(hourly_rate * COALESCE(actual_duration, 4)), 0) as revenue 
       FROM jobs 
       WHERE status = 'completed' 
       AND DATE(updated_at) = CURDATE()`
    );
    const todayRevenue = revenueResult[0].revenue || 0;

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
    // Active bookings
    const [activeResult] = await db.execute(
      "SELECT COUNT(*) as count FROM jobs WHERE homeowner_id = ? AND status IN ('in_progress', 'accepted', 'requested')",
      [userId]
    );
    const activeBookings = activeResult[0].count;

    // Upcoming jobs
    const [upcomingResult] = await db.execute(
      "SELECT COUNT(*) as count FROM jobs WHERE homeowner_id = ? AND status IN ('accepted', 'requested') AND scheduled_datetime > NOW()",
      [userId]
    );
    const upcomingJobs = upcomingResult[0].count;

    // Pending reviews (completed jobs without reviews)
    const [pendingReviewsResult] = await db.execute(
      `SELECT COUNT(*) as count FROM jobs j 
       WHERE j.homeowner_id = ? 
       AND j.status = 'completed' 
       AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.job_id = j.job_id)`,
      [userId]
    );
    const pendingReviews = pendingReviewsResult[0].count;

    // Total spent
    const [spentResult] = await db.execute(
      `SELECT COALESCE(SUM(hourly_rate * COALESCE(actual_duration, 4)), 0) as total 
       FROM jobs 
       WHERE homeowner_id = ? AND status = 'completed'`,
      [userId]
    );
    const totalSpent = spentResult[0].total || 0;

    // Favorite maids count
    const [favoritesResult] = await db.execute(
      `SELECT COUNT(DISTINCT maid_id) as count FROM jobs 
       WHERE homeowner_id = ? AND status = 'completed'`,
      [userId]
    );
    const favoriteMaids = favoritesResult[0].count;

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
    // First get maid_id from user_id
    const [maidResult] = await db.execute(
      'SELECT maid_id FROM maids WHERE user_id = ?',
      [userId]
    );
    
    if (!maidResult.length) {
      return {
        todayJobs: 0,
        completedJobs: 0,
        totalHours: 0,
        earnings: 0,
        rating: 0,
        reviewCount: 0
      };
    }
    
    const maidId = maidResult[0].maid_id;

    // Today's jobs
    const [todayResult] = await db.execute(
      "SELECT COUNT(*) as count FROM jobs WHERE maid_id = ? AND DATE(scheduled_datetime) = CURDATE()",
      [maidId]
    );
    const todayJobs = todayResult[0].count;

    // Completed jobs
    const [completedResult] = await db.execute(
      "SELECT COUNT(*) as count FROM jobs WHERE maid_id = ? AND status = 'completed'",
      [maidId]
    );
    const completedJobs = completedResult[0].count;

    // Total hours worked
    const [hoursResult] = await db.execute(
      `SELECT COALESCE(SUM(COALESCE(actual_duration, 4)), 0) as hours 
       FROM jobs 
       WHERE maid_id = ? AND status = 'completed'`,
      [maidId]
    );
    const totalHours = hoursResult[0].hours || 0;

    // Total earnings
    const [earningsResult] = await db.execute(
      `SELECT COALESCE(SUM(hourly_rate * COALESCE(actual_duration, 4)), 0) as earnings 
       FROM jobs 
       WHERE maid_id = ? AND status = 'completed'`,
      [maidId]
    );
    const earnings = earningsResult[0].earnings || 0;

    // Average rating
    const [ratingResult] = await db.execute(
      `SELECT AVG(r.rating) as avgRating, COUNT(*) as count 
       FROM reviews r 
       INNER JOIN jobs j ON r.job_id = j.job_id 
       WHERE j.maid_id = ?`,
      [maidId]
    );
    const rating = ratingResult[0].avgRating || 0;
    const reviewCount = ratingResult[0].count || 0;

    // Active/pending jobs
    const [activeResult] = await db.execute(
      "SELECT COUNT(*) as count FROM jobs WHERE maid_id = ? AND status IN ('in_progress', 'accepted', 'requested')",
      [maidId]
    );
    const activeJobs = activeResult[0].count;

    return {
      todayJobs,
      completedJobs,
      totalHours,
      earnings,
      rating: parseFloat(rating).toFixed(1),
      reviewCount,
      activeJobs
    };
  }
}

module.exports = DashboardService;
