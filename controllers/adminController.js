const NotificationService = require('../services/notificationService');
const User = require('../models/User');
const Maid = require('../models/Maid');
const Job = require('../models/Job');
const Attendance = require('../models/Attendance');
const Review = require('../models/Review');
const bcrypt = require('bcrypt');

// ============================================================
// Dashboard
// ============================================================

/**
 * Get admin dashboard stats and data
 */
const getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Parallel queries for stats
    const [
      totalMaids,
      pendingMaids,
      totalHomeowners,
      onDutyToday,
      pendingJobs,
      completedThisMonth,
      todayJobs,
      recentActivities
    ] = await Promise.all([
      Maid.countDocuments({ approval_status: 'approved' }),
      Maid.countDocuments({ approval_status: 'pending' }),
      User.countDocuments({ role: 'homeowner' }),
      Job.countDocuments({
        scheduled_datetime: { $gte: today, $lt: tomorrow },
        status: { $in: ['in_progress', 'accepted'] }
      }),
      Job.countDocuments({ status: { $in: ['requested', 'accepted'] } }),
      Job.countDocuments({ status: 'completed', updatedAt: { $gte: startOfMonth } }),
      Job.find({
        scheduled_datetime: { $gte: today, $lt: tomorrow }
      })
        .populate('maid_id')
        .populate('homeowner_id', 'name')
        .sort({ scheduled_datetime: 1 })
        .limit(10)
        .lean(),
      getRecentActivities(10)
    ]);

    // Calculate revenue this month (simplified - based on completed jobs)
    const monthlyJobs = await Job.find({
      status: 'completed',
      updatedAt: { $gte: startOfMonth }
    });
    const revenueThisMonth = monthlyJobs.reduce((sum, job) => {
      return sum + (job.hourly_rate * (job.actual_duration || job.estimated_duration || 4));
    }, 0);

    // Format today's schedule
    const todaySchedule = todayJobs.map(job => ({
      id: job._id,
      title: job.title,
      maidName: job.maid_id?.user_id ? 'Maid' : 'Unknown',
      homeownerName: job.homeowner_id?.name || 'Unknown',
      time: new Date(job.scheduled_datetime).toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit', hour12: true 
      }),
      status: job.status,
      address: job.address
    }));

    return res.json({
      stats: {
        totalMaids,
        pendingMaids,
        totalHomeowners,
        onDutyToday,
        pendingJobs,
        completedThisMonth,
        revenueThisMonth: Math.round(revenueThisMonth * 100) / 100
      },
      todaySchedule,
      recentActivities
    });
  } catch (error) {
    console.error('Error getting admin dashboard:', error);
    return res.status(500).json({ message: 'Failed to get dashboard data' });
  }
};

/**
 * Get recent activities for dashboard
 */
async function getRecentActivities(limit = 10) {
  const activities = [];
  
  // Recent job completions
  const recentJobs = await Job.find({ status: 'completed' })
    .populate('homeowner_id', 'name')
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();
  
  recentJobs.forEach(job => {
    activities.push({
      type: 'job_completed',
      icon: 'fa-check-circle',
      color: 'green',
      message: `Job "${job.title}" completed`,
      detail: job.homeowner_id?.name || 'Unknown',
      time: job.updatedAt
    });
  });
  
  // Recent maid registrations
  const recentMaids = await Maid.find()
    .populate('user_id', 'name')
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();
  
  recentMaids.forEach(maid => {
    activities.push({
      type: 'maid_registered',
      icon: 'fa-user-plus',
      color: 'blue',
      message: `New maid registered: ${maid.user_id?.name || 'Unknown'}`,
      detail: maid.approval_status,
      time: maid.createdAt
    });
  });
  
  // Sort by time and limit
  return activities
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, limit)
    .map(a => ({
      ...a,
      timeAgo: formatTimeAgo(a.time)
    }));
}

// ============================================================
// Reports
// ============================================================

/**
 * Get reports summary
 */
const getReportsSummary = async (req, res) => {
  try {
    const range = req.query.range || 'month';
    const today = new Date();
    let startDate;
    
    if (range === 'week') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    const [jobs, reviews] = await Promise.all([
      Job.find({ createdAt: { $gte: startDate } }),
      Review.find({ createdAt: { $gte: startDate } })
    ]);
    
    const completed = jobs.filter(j => j.status === 'completed');
    const totalRevenue = completed.reduce((sum, job) => {
      return sum + (job.hourly_rate * (job.actual_duration || job.estimated_duration || 4));
    }, 0);
    
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    
    return res.json({
      range,
      totalJobs: jobs.length,
      completedJobs: completed.length,
      cancelledJobs: jobs.filter(j => j.status === 'cancelled').length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalReviews: reviews.length,
      averageRating: Math.round(avgRating * 10) / 10,
      completionRate: jobs.length > 0 
        ? Math.round((completed.length / jobs.length) * 100) 
        : 0
    });
  } catch (error) {
    console.error('Error getting reports summary:', error);
    return res.status(500).json({ message: 'Failed to get reports' });
  }
};

/**
 * Get performance data for charts
 */
const getPerformanceData = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const jobs = await Job.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).lean();
    
    // Group by date
    const dailyData = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      dailyData[key] = { date: key, jobs: 0, completed: 0, revenue: 0 };
    }
    
    jobs.forEach(job => {
      const key = new Date(job.createdAt).toISOString().split('T')[0];
      if (dailyData[key]) {
        dailyData[key].jobs++;
        if (job.status === 'completed') {
          dailyData[key].completed++;
          dailyData[key].revenue += job.hourly_rate * (job.actual_duration || job.estimated_duration || 4);
        }
      }
    });
    
    return res.json({
      data: Object.values(dailyData),
      summary: {
        totalJobs: jobs.length,
        totalCompleted: jobs.filter(j => j.status === 'completed').length
      }
    });
  } catch (error) {
    console.error('Error getting performance data:', error);
    return res.status(500).json({ message: 'Failed to get performance data' });
  }
};

// ============================================================
// Schedule
// ============================================================

/**
 * Get schedule/calendar events
 */
const getSchedule = async (req, res) => {
  try {
    const { from, to } = req.query;
    
    const startDate = from ? new Date(from) : new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = to ? new Date(to) : new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setHours(23, 59, 59, 999);
    
    const jobs = await Job.find({
      scheduled_datetime: { $gte: startDate, $lte: endDate },
      status: { $ne: 'cancelled' }
    })
      .populate({
        path: 'maid_id',
        populate: { path: 'user_id', select: 'name' }
      })
      .populate('homeowner_id', 'name')
      .sort({ scheduled_datetime: 1 })
      .lean();
    
    const events = jobs.map(job => ({
      id: job._id,
      title: job.title,
      maidName: job.maid_id?.user_id?.name || 'Unknown',
      homeownerName: job.homeowner_id?.name || 'Unknown',
      start: job.scheduled_datetime,
      end: new Date(new Date(job.scheduled_datetime).getTime() + (job.estimated_duration || 4) * 3600000),
      status: job.status,
      address: job.address,
      hourlyRate: job.hourly_rate
    }));
    
    return res.json({ events });
  } catch (error) {
    console.error('Error getting schedule:', error);
    return res.status(500).json({ message: 'Failed to get schedule' });
  }
};

// ============================================================
// Attendance
// ============================================================

/**
 * Get attendance records
 */
const getAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    
    let startDate, endDate;
    if (date) {
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }
    
    const attendance = await Attendance.find({
      check_in_time: { $gte: startDate, $lte: endDate }
    })
      .populate({
        path: 'job_id',
        populate: [
          { path: 'maid_id', populate: { path: 'user_id', select: 'name' } },
          { path: 'homeowner_id', select: 'name' }
        ]
      })
      .sort({ check_in_time: -1 })
      .lean();
    
    const records = attendance.map(a => ({
      id: a._id,
      maidName: a.job_id?.maid_id?.user_id?.name || 'Unknown',
      jobTitle: a.job_id?.title || 'Unknown',
      homeownerName: a.job_id?.homeowner_id?.name || 'Unknown',
      checkIn: a.check_in_time,
      checkOut: a.check_out_time,
      duration: a.check_out_time 
        ? Math.round((new Date(a.check_out_time) - new Date(a.check_in_time)) / 3600000 * 10) / 10
        : null,
      status: a.check_out_time ? 'completed' : 'on_duty'
    }));
    
    return res.json({
      date: startDate.toISOString().split('T')[0],
      count: records.length,
      records
    });
  } catch (error) {
    console.error('Error getting attendance:', error);
    return res.status(500).json({ message: 'Failed to get attendance' });
  }
};

// ============================================================
// Settings
// ============================================================

/**
 * Get admin profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId)
      .select('name email phone photo_url role createdAt');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.json(user);
  } catch (error) {
    console.error('Error getting admin profile:', error);
    return res.status(500).json({ message: 'Failed to get profile' });
  }
};

/**
 * Update admin profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, phone } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    
    await User.findByIdAndUpdate(userId, updates);
    
    return res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
};

/**
 * Change admin password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    const newHash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { password_hash: newHash });
    
    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ message: 'Failed to change password' });
  }
};

// ============================================================
// Notifications (existing)
// ============================================================

const getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const notifications = await NotificationService.getAllNotifications(limit);
    return res.json({ count: notifications.length, notifications });
  } catch (err) {
    console.error('Get notifications error', err);
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

const getPendingNotifications = async (req, res) => {
  try {
    const notifications = await NotificationService.getPendingNotifications();
    return res.json({ count: notifications.length, notifications });
  } catch (err) {
    console.error('Get pending notifications error', err);
    return res.status(500).json({ message: 'Failed to fetch pending notifications' });
  }
};

const getPendingVerifications = async (req, res) => {
  try {
    const users = await User.find({ verification_status: 'pending' })
      .select('name email role id_document_url selfie_url verification_status createdAt')
      .sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    console.error('Error getting pending verifications:', error);
    return res.status(500).json({ message: 'Failed to get pending verifications' });
  }
};

const processVerification = async (req, res) => {
  try {
    const { userId, action, reason } = req.body;
    if (!userId || !action) {
      return res.status(400).json({ message: 'userId and action are required' });
    }
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be approve or reject' });
    }
    const status = action === 'approve' ? 'verified' : 'rejected';
    await User.findByIdAndUpdate(userId, {
      verification_status: status,
      verification_notes: reason || null
    });
    return res.json({ message: `User verification ${action}d successfully`, status });
  } catch (error) {
    console.error('Error processing verification:', error);
    return res.status(500).json({ message: 'Failed to process verification' });
  }
};

// ============================================================
// Helpers
// ============================================================

function formatTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

module.exports = {
  getDashboard,
  getReportsSummary,
  getPerformanceData,
  getSchedule,
  getAttendance,
  getProfile,
  updateProfile,
  changePassword,
  getNotifications,
  getPendingNotifications,
  getPendingVerifications,
  processVerification
};
