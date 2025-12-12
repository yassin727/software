const db = require('../config/db');

class JobModel {
  static async create({ homeownerId, maidId, title, description, address, scheduledDatetime, hourlyRate }) {
    const [result] = await db.execute(
      `INSERT INTO jobs (homeowner_id, maid_id, title, description, address, scheduled_datetime, status, hourly_rate)
       VALUES (?, ?, ?, ?, ?, ?, 'requested', ?)`,
      [homeownerId, maidId, title, description, address, scheduledDatetime, hourlyRate]
    );
    return result.insertId;
  }

  static async updateStatus(jobId, status) {
    const [result] = await db.execute('UPDATE jobs SET status = ? WHERE job_id = ?', [status, jobId]);
    return result.affectedRows;
  }

  static async findById(jobId) {
    const [rows] = await db.execute('SELECT * FROM jobs WHERE job_id = ?', [jobId]);
    return rows[0];
  }
  static async countCompletedJobsForMaid(maidId, homeownerId) {
    let sql = `SELECT COUNT(*) AS cnt FROM jobs WHERE maid_id = ? AND status = 'completed'`;
    const params = [maidId];
  
    if (homeownerId) {
      sql += ' AND homeowner_id = ?';
      params.push(homeownerId);
    }
  
    const [rows] = await db.query(sql, params);
    return rows[0].cnt || 0;
  }

  static async listForUser(userId, role) {
    if (role === 'homeowner') {
      const [rows] = await db.execute('SELECT * FROM jobs WHERE homeowner_id = ?', [userId]);
      return rows;
    }

    if (role === 'maid') {
      const [rows] = await db.execute(
        `SELECT j.*
         FROM jobs j
         INNER JOIN maids m ON j.maid_id = m.maid_id
         WHERE m.user_id = ?`,
        [userId]
      );
      return rows;
    }

    // For other roles, return all jobs by default
    const [rows] = await db.execute('SELECT * FROM jobs');
    return rows;
  }
}

module.exports = JobModel;

