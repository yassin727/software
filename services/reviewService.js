const Review = require('../models/Review');
const Maid = require('../models/Maid');

class ReviewService {
  static async createReview({ jobId, reviewerId, revieweeId, rating, comments }) {
    const review = new Review({
      job_id: jobId,
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      rating,
      comments: comments || null,
    });

    const savedReview = await review.save();

    // Optional: recalculate maid average rating
    const reviews = await Review.find({ reviewee_id: revieweeId });
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await Maid.findOneAndUpdate(
        { user_id: revieweeId },
        { average_rating: avgRating, total_reviews: reviews.length }
      );
    }

    return savedReview._id;
  }

  // List reviews for a maid
  static async getReviewsForMaid(maidUserId) {
    return await Review.find({ reviewee_id: maidUserId })
      .populate('reviewer_id', 'name')
      .sort({ createdAt: -1 })
      .lean();
  }
}

module.exports = ReviewService;