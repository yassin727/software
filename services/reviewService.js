const Review = require('../models/Review');
const Maid = require('../models/Maid');

class ReviewService {
  static async createReview({ jobId, reviewerId, revieweeId, rating, comments }) {
    const review = new Review({
      job_id: jobId,
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      rating,
      comments: comments || '',
    });

    const savedReview = await review.save();

    // Recalculate maid average rating
    // revieweeId is the maid's user_id
    const reviews = await Review.find({ reviewee_id: revieweeId });
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      const roundedRating = Math.round(avgRating * 10) / 10; // Round to 1 decimal
      
      const updateResult = await Maid.findOneAndUpdate(
        { user_id: revieweeId },
        { 
          average_rating: roundedRating, 
          total_reviews: reviews.length 
        },
        { new: true }
      );
      
      console.log(`Updated maid rating: user_id=${revieweeId}, avgRating=${roundedRating}, totalReviews=${reviews.length}, updated=${!!updateResult}`);
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