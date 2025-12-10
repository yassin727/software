const db = require('../config/db');

class ReviewModel {
  static async create({ jobId, reviewerId, revieweeId, rating, comments }) {
    const [result] = await db.execute(
      `INSERT INTO reviews (job_id, reviewer_id, reviewee_id, rating, comments)
       VALUES (?, ?, ?, ?, ?)`,
      [jobId, reviewerId, revieweeId, rating, comments]
    );
    return result.insertId;
  }
}

module.exports = ReviewModel;

