// models/reviewModel.js
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

  static async getForMaid(maidUserId) {
    const [rows] = await db.execute(
      `SELECT r.*, u.name AS reviewer_name
       FROM reviews r
       INNER JOIN users u ON r.reviewer_id = u.user_id
       WHERE r.reviewee_id = ?
       ORDER BY r.created_at DESC`,
      [maidUserId]
    );
    return rows;
  }
}

module.exports = ReviewModel;