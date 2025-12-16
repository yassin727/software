const User = require('../models/User');
const Maid = require('../models/Maid');
const Job = require('../models/Job');
const Review = require('../models/Review');

/**
 * Get homeowner dashboard data
 * Returns stats, today's schedule, and recent activity
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get active bookings count
    const activeBookings = await Job.countDocuments({
      homeowner_id: userId,
      status: { $in: ['in_progress', 'accepted', 'requested'] }
    });

    // Get maids on-site today (in_progress jobs scheduled for today)
    const maidsOnSiteToday = await Job.countDocuments({
      homeowner_id: userId,
      status: 'in_progress',
      scheduled_datetime: { $gte: today, $lt: tomorrow }
    });

    // Get pending reviews (completed jobs without reviews)
    const completedJobs = await Job.find({
      homeowner_id: userId,
      status: 'completed'
    }).select('_id');
    
    const reviewedJobIds = await Review.find({
      job_id: { $in: completedJobs.map(j => j._id) },
      reviewer_id: userId
    }).select('job_id');
    
    const pendingReviews = completedJobs.length - reviewedJobIds.length;

    // Calculate monthly spend
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyJobs = await Job.find({
      homeowner_id: userId,
      status: 'completed',
      updatedAt: { $gte: startOfMonth }
    });
    const monthlySpend = monthlyJobs.reduce((sum, job) => {
      return sum + (job.hourly_rate * (job.actual_duration || job.estimated_duration || 4));
    }, 0);

    // Get today's schedule
    const todaySchedule = await Job.find({
      homeowner_id: userId,
      scheduled_datetime: { $gte: today, $lt: tomorrow },
      status: { $ne: 'cancelled' }
    })
    .populate({
      path: 'maid_id',
      populate: { path: 'user_id', select: 'name photo_url' }
    })
    .sort({ scheduled_datetime: 1 });

    const scheduleItems = todaySchedule.map(job => ({
      id: job._id,
      time: new Date(job.scheduled_datetime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      maidName: job.maid_id?.user_id?.name || 'Unknown',
      maidPhoto: job.maid_id?.user_id?.photo_url || null,
      service: job.title,
      address: job.address,
      status: job.status
    }));

    // Get recent activity (last 5 job updates)
    const recentJobs = await Job.find({ homeowner_id: userId })
      .populate({
        path: 'maid_id',
        populate: { path: 'user_id', select: 'name' }
      })
      .sort({ updatedAt: -1 })
      .limit(5);

    const recentActivity = recentJobs.map(job => ({
      id: job._id,
      maidName: job.maid_id?.user_id?.name || 'Unknown',
      action: getActivityAction(job.status),
      service: job.title,
      time: formatTimeAgo(job.updatedAt),
      type: getActivityType(job.status)
    }));

    return res.json({
      stats: {
        activeBookings,
        maidsOnSiteToday,
        pendingReviews,
        monthlySpend: Math.round(monthlySpend * 100) / 100
      },
      todaySchedule: scheduleItems,
      recentActivity
    });
  } catch (error) {
    console.error('Error getting homeowner dashboard:', error);
    return res.status(500).json({ message: 'Failed to get dashboard data' });
  }
};

/**
 * Search maids with filters
 */
const searchMaids = async (req, res) => {
  try {
    const { location, specialization, availability, minRating } = req.query;

    // Build filter query
    const filter = { approval_status: 'approved' };

    if (location && location !== 'All Locations') {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (specialization && specialization !== 'All Types') {
      filter.specializations = { $regex: specialization, $options: 'i' };
    }

    if (minRating) {
      filter.average_rating = { $gte: parseFloat(minRating) };
    }

    // Get maids with user info
    let maids = await Maid.find(filter)
      .populate('user_id', 'name email photo_url verification_status')
      .sort({ average_rating: -1, total_reviews: -1 });

    // Filter by availability if specified
    if (availability && availability !== 'Any Time') {
      if (availability === 'Available Now') {
        maids = maids.filter(m => m.is_online);
      }
      // Other availability filters could check availability_schedule
    }

    const maidList = maids.map(maid => ({
      id: maid._id,
      userId: maid.user_id?._id, // User ID for messaging
      name: maid.user_id?.name || 'Unknown',
      email: maid.user_id?.email,
      photo: maid.user_id?.photo_url || null,
      rating: maid.average_rating,
      totalReviews: maid.total_reviews,
      specialization: maid.specializations,
      hourlyRate: maid.hourly_rate,
      location: maid.location,
      experienceYears: maid.experience_years,
      isOnline: maid.is_online,
      isVerified: maid.is_verified || maid.user_id?.verification_status === 'verified',
      bio: maid.bio
    }));

    return res.json({
      count: maidList.length,
      maids: maidList
    });
  } catch (error) {
    console.error('Error searching maids:', error);
    return res.status(500).json({ message: 'Failed to search maids' });
  }
};

/**
 * Get homeowner's bookings with optional status filter
 */
const getBookings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const filter = { homeowner_id: userId };
    
    if (status && status !== 'all') {
      if (status === 'upcoming') {
        filter.status = { $in: ['requested', 'accepted'] };
        filter.scheduled_datetime = { $gt: new Date() };
      } else if (status === 'active') {
        filter.status = 'in_progress';
      } else if (status === 'completed') {
        filter.status = 'completed';
      } else if (status === 'cancelled') {
        filter.status = 'cancelled';
      }
    }

    const bookings = await Job.find(filter)
      .populate({
        path: 'maid_id',
        populate: { path: 'user_id', select: 'name photo_url' }
      })
      .sort({ scheduled_datetime: -1 });

    // Check which bookings have reviews
    const bookingIds = bookings.map(b => b._id);
    const reviews = await Review.find({ 
      job_id: { $in: bookingIds },
      reviewer_id: userId 
    }).select('job_id');
    const reviewedIds = new Set(reviews.map(r => r.job_id.toString()));

    const bookingList = bookings.map(booking => {
      const progressPercent = booking.progress_percentage || 0;
      return {
        id: booking._id,
        title: booking.title,
        description: booking.description,
        address: booking.address,
        scheduledDatetime: booking.scheduled_datetime,
        status: booking.status,
        hourlyRate: booking.hourly_rate,
        estimatedDuration: booking.estimated_duration,
        actualDuration: booking.actual_duration,
        estimatedTotal: booking.hourly_rate * (booking.estimated_duration || 4),
        progressPercentage: progressPercent,
        maid: {
          id: booking.maid_id?._id,
          userId: booking.maid_id?.user_id?._id, // User ID for messaging
          name: booking.maid_id?.user_id?.name || 'Unknown',
          photo: booking.maid_id?.user_id?.photo_url || null,
          rating: booking.maid_id?.average_rating || 0
        },
        hasReview: reviewedIds.has(booking._id.toString()),
        createdAt: booking.createdAt
      };
    });

    return res.json({
      count: bookingList.length,
      bookings: bookingList
    });
  } catch (error) {
    console.error('Error getting bookings:', error);
    return res.status(500).json({ message: 'Failed to get bookings' });
  }
};

/**
 * Get single booking details
 */
const getBookingById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const booking = await Job.findOne({ _id: id, homeowner_id: userId })
      .populate({
        path: 'maid_id',
        populate: { path: 'user_id', select: 'name email phone photo_url' }
      });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Get review if exists
    const review = await Review.findOne({ job_id: id, reviewer_id: userId });

    return res.json({
      id: booking._id,
      title: booking.title,
      description: booking.description,
      address: booking.address,
      scheduledDatetime: booking.scheduled_datetime,
      status: booking.status,
      hourlyRate: booking.hourly_rate,
      estimatedDuration: booking.estimated_duration,
      actualDuration: booking.actual_duration,
      maid: {
        id: booking.maid_id?._id,
        name: booking.maid_id?.user_id?.name || 'Unknown',
        email: booking.maid_id?.user_id?.email,
        phone: booking.maid_id?.user_id?.phone,
        photo: booking.maid_id?.user_id?.photo_url || null,
        rating: booking.maid_id?.average_rating || 0,
        specialization: booking.maid_id?.specializations
      },
      review: review ? {
        rating: review.rating,
        comment: review.comments,
        createdAt: review.createdAt
      } : null,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    });
  } catch (error) {
    console.error('Error getting booking:', error);
    return res.status(500).json({ message: 'Failed to get booking details' });
  }
};

/**
 * Get service history (completed bookings)
 */
const getHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    const filter = { 
      homeowner_id: userId,
      status: 'completed'
    };

    if (startDate) {
      filter.scheduled_datetime = { $gte: new Date(startDate) };
    }
    if (endDate) {
      filter.scheduled_datetime = { 
        ...filter.scheduled_datetime,
        $lte: new Date(endDate) 
      };
    }

    const history = await Job.find(filter)
      .populate({
        path: 'maid_id',
        populate: { path: 'user_id', select: 'name photo_url' }
      })
      .sort({ scheduled_datetime: -1 });

    // Get reviews for these jobs
    const jobIds = history.map(h => h._id);
    const reviews = await Review.find({ 
      job_id: { $in: jobIds },
      reviewer_id: userId 
    });
    const reviewMap = new Map(reviews.map(r => [r.job_id.toString(), r]));

    const historyList = history.map(job => {
      const review = reviewMap.get(job._id.toString());
      const totalAmount = job.hourly_rate * (job.actual_duration || job.estimated_duration || 4);
      
      return {
        id: job._id,
        title: job.title,
        address: job.address,
        scheduledDatetime: job.scheduled_datetime,
        totalAmount: Math.round(totalAmount * 100) / 100,
        duration: job.actual_duration || job.estimated_duration,
        maid: {
          id: job.maid_id?._id,
          name: job.maid_id?.user_id?.name || 'Unknown',
          photo: job.maid_id?.user_id?.photo_url || null
        },
        review: review ? {
          rating: review.rating,
          comment: review.comments
        } : null
      };
    });

    // Calculate totals
    const totalSpent = historyList.reduce((sum, h) => sum + h.totalAmount, 0);
    const totalJobs = historyList.length;

    return res.json({
      count: totalJobs,
      totalSpent: Math.round(totalSpent * 100) / 100,
      history: historyList
    });
  } catch (error) {
    console.error('Error getting history:', error);
    return res.status(500).json({ message: 'Failed to get service history' });
  }
};

/**
 * Get maid profile for viewing
 */
const getMaidProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const maid = await Maid.findById(id)
      .populate('user_id', 'name email phone photo_url verification_status createdAt');

    if (!maid || maid.approval_status !== 'approved') {
      return res.status(404).json({ message: 'Maid not found' });
    }

    // Get reviews for this maid
    const reviews = await Review.find({ reviewee_id: maid.user_id._id })
      .populate('reviewer_id', 'name photo_url')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get completed jobs count
    const completedJobs = await Job.countDocuments({ 
      maid_id: id, 
      status: 'completed' 
    });

    return res.json({
      id: maid._id,
      name: maid.user_id?.name || 'Unknown',
      email: maid.user_id?.email,
      phone: maid.user_id?.phone,
      photo: maid.user_id?.photo_url || null,
      isVerified: maid.is_verified || maid.user_id?.verification_status === 'verified',
      rating: maid.average_rating,
      totalReviews: maid.total_reviews,
      specialization: maid.specializations,
      hourlyRate: maid.hourly_rate,
      location: maid.location,
      experienceYears: maid.experience_years,
      bio: maid.bio,
      isOnline: maid.is_online,
      completedJobs,
      memberSince: maid.user_id?.createdAt,
      reviews: reviews.map(r => ({
        id: r._id,
        rating: r.rating,
        comment: r.comments,
        reviewerName: r.reviewer_id?.name || 'Anonymous',
        reviewerPhoto: r.reviewer_id?.photo_url || null,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Error getting maid profile:', error);
    return res.status(500).json({ message: 'Failed to get maid profile' });
  }
};

// Helper functions
function getActivityAction(status) {
  switch (status) {
    case 'in_progress': return 'checked in';
    case 'completed': return 'completed service';
    case 'accepted': return 'accepted booking';
    case 'requested': return 'booking requested';
    case 'cancelled': return 'booking cancelled';
    default: return 'updated';
  }
}

function getActivityType(status) {
  switch (status) {
    case 'in_progress': return 'green';
    case 'completed': return 'blue';
    case 'accepted': return 'blue';
    case 'requested': return 'orange';
    case 'cancelled': return 'red';
    default: return 'gray';
  }
}

function formatTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

module.exports = {
  getDashboard,
  searchMaids,
  getBookings,
  getBookingById,
  getHistory,
  getMaidProfile
};
