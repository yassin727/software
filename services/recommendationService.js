const Maid = require('../models/Maid');
const Job = require('../models/Job');
const Review = require('../models/Review');

class RecommendationService {
  /**
   * Returns top N recommended maids for a homeowner.
   * This is a rule-based scoring function (lightweight AI)
   * and can later be replaced by a real ML model.
   */
  static async getRecommendedMaidsForHomeowner(homeownerId, limit = 5) {
    // 1) get all approved maids with user data
    const maids = await Maid.find({ approval_status: 'approved' })
      .populate('user_id', 'name email')
      .lean();

    // 2) for each maid, compute:
    //    - avg rating
    //    - number of completed jobs for this homeowner (optional filter)
    const scores = [];

    for (const maid of maids) {
      const maidUserId = maid.user_id?._id;

      // Get reviews for this maid
      const reviews = await Review.find({ reviewee_id: maidUserId }).lean();
      const avgRating =
        reviews.length === 0
          ? 0
          : reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      // Count completed jobs
      const completedJobs = await Job.countDocuments({
        maid_id: maid._id,
        status: 'completed'
      });

      // Simple scoring formula (you can mention this in the report)
      const score = avgRating * 2 + completedJobs;

      scores.push({
        maidId: maid._id,
        maidUserId,
        name: maid.user_id?.name || 'Unknown',
        email: maid.user_id?.email || '',
        avgRating,
        completedJobs,
        score,
      });
    }

    // 3) sort by score desc and return top N
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, limit);
  }
}

module.exports = RecommendationService;