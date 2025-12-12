const MaidModel = require('../models/maidModel');
const JobModel = require('../models/jobModel');
const ReviewModel = require('../models/reviewModel');

class RecommendationService {
  /**
   * Returns top N recommended maids for a homeowner.
   * This is a rule-based scoring function (lightweight AI)
   * and can later be replaced by a real ML model.
   */
  static async getRecommendedMaidsForHomeowner(homeownerId, limit = 5) {
    // 1) get all approved maids
    const maids = await MaidModel.getApprovedWithUserData();

    // 2) for each maid, compute:
    //    - avg rating
    //    - number of completed jobs for this homeowner (optional filter)
    const scores = [];

    for (const maid of maids) {
      const maidUserId = maid.user_id;

      const reviews = await ReviewModel.getForMaid(maidUserId);
      const avgRating =
        reviews.length === 0
          ? 0
          : reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      const completedJobs = await JobModel.countCompletedJobsForMaid(
        maid.maid_id,
        homeownerId
      );

      // Simple scoring formula (you can mention this in the report)
      const score = avgRating * 2 + completedJobs;

      scores.push({
        maidId: maid.maid_id,
        maidUserId,
        name: maid.name,
        email: maid.email,
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