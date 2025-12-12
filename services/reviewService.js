const ReviewModel = require('../models/reviewModel');
// If you later want to update maid average rating, you can also require MaidModel here.

class ReviewService {
  static async createReview({ jobId, reviewerId, revieweeId, rating, comments }) {
    const reviewId = await ReviewModel.create({
      jobId,
      reviewerId,
      revieweeId,
      rating,
      comments: comments || null,
    });

    // Optional: recalculate maid rating here by querying all reviews, then update MaidModel.
    return reviewId;
  }

  // Optional if you need to list reviews for a maid
  static async getReviewsForMaid(maidUserId) {
    if (typeof ReviewModel.getForMaid === 'function') {
      return ReviewModel.getForMaid(maidUserId);
    }
    return [];
  }
}

module.exports = ReviewService;