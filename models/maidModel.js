const db = require('../config/db');

class MaidModel {
  static async create(userId) {
    const [result] = await db.execute(
      'INSERT INTO maids (user_id, approval_status) VALUES (?, ?)',
      [userId, 'pending']
    );
    return result.insertId;
  }

  /**
   * Get maid profile by user ID
   */
  static async getByUserId(userId) {
    const [rows] = await db.execute(
      'SELECT * FROM maids WHERE user_id = ?',
      [userId]
    );
    return rows[0];
  }

  /**
   * Get maid with user data by maid_id
   */
  static async getById(maidId) {
    const [rows] = await db.execute(
      `SELECT m.*, u.name, u.email, u.phone
       FROM maids m
       INNER JOIN users u ON m.user_id = u.user_id
       WHERE m.maid_id = ?`,
      [maidId]
    );
    return rows[0];
  }

  static async approve(maidId) {
    const [result] = await db.execute(
      'UPDATE maids SET approval_status = ? WHERE maid_id = ?',
      ['approved', maidId]
    );
    return result.affectedRows;
  }

  static async reject(maidId, reason = '') {
    const [result] = await db.execute(
      'UPDATE maids SET approval_status = ?, rejection_reason = ? WHERE maid_id = ?',
      ['rejected', reason, maidId]
    );
    return result.affectedRows;
  }
  static async getApprovedWithUserData() {
    const [rows] = await db.query(
      `SELECT m.*, u.user_id, u.name, u.email
       FROM maids m
       JOIN users u ON m.user_id = u.user_id
       WHERE m.approval_status = 'approved'`
    );
    return rows;
  }
  
  static async getPending() {
    const [rows] = await db.execute(
      `SELECT m.*, u.name, u.email
       FROM maids m
       INNER JOIN users u ON m.user_id = u.user_id
       WHERE m.approval_status = 'pending'`
    );
    return rows;
  }
}

module.exports = MaidModel;

