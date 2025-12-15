const ReviewService = require('../services/reviewService');
const NotificationService = require('../services/notificationService');
const User = require('../models/User');
const Job = require('../models/Job');

/**
 * (Optional) List reviews for a maid by maid user_id.
 * Keep if you still need it.
 */
const listReviewsForMaid = async (req, res) => {
  try {
    const { maidUserId } = req.params; // user_id of maid
    const reviews = await ReviewService.getReviewsForMaid(maidUserId);
    return res.json(reviews);
  } catch (err) {
    console.error('List reviews error', err);
    return res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};

/**
 * Homeowner creates a review for a maid.
 */
const createReview = async (req, res) => {
  try {
    const reviewerId = req.user.userId; // homeowner
    const { jobId, revieweeId, rating, comments } = req.body;

    if (!jobId || !revieweeId || rating == null) {
      return res.status(400).json({
        message: 'jobId, revieweeId, and rating are required',
      });
    }

    const parsedRating = Number(rating);
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res
        .status(400)
        .json({ message: 'rating must be between 1 and 5' });
    }

    const reviewId = await ReviewService.createReview({
      jobId,
      reviewerId,
      revieweeId,
      rating: parsedRating,
      comments,
    });

    // Notify maid of new review
    try {
      const [reviewer, job] = await Promise.all([
        User.findById(reviewerId),
        Job.findById(jobId)
      ]);
      
      await NotificationService.notifyNewReview(
        revieweeId,
        { _id: reviewId, rating: parsedRating, job_id: jobId },
        reviewer?.name || 'A client',
        job?.title || 'Service'
      );
    } catch (notifError) {
      console.error('Failed to send review notification:', notifError);
    }

    return res
      .status(201)
      .json({ reviewId, message: 'Review created successfully' });
  } catch (err) {
    console.error('Create review error', err);
    return res.status(500).json({ message: 'Failed to create review' });
  }
};

module.exports = {
  listReviewsForMaid,
  createReview,
};