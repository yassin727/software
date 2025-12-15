const db = require('../config/db');

class LocationModel {
  /**
   * Update maid location
   */
  static async updateLocation(maidId, latitude, longitude) {
    // Check if location record exists
    const [existing] = await db.execute(
      'SELECT id FROM maid_locations WHERE maid_id = ?',
      [maidId]
    );
    
    if (existing.length > 0) {
      // Update existing
      await db.execute(
        'UPDATE maid_locations SET latitude = ?, longitude = ?, updated_at = NOW() WHERE maid_id = ?',
        [latitude, longitude, maidId]
      );
      return existing[0].id;
    } else {
      // Insert new
      const [result] = await db.execute(
        'INSERT INTO maid_locations (maid_id, latitude, longitude) VALUES (?, ?, ?)',
        [maidId, latitude, longitude]
      );
      return result.insertId;
    }
  }

  /**
   * Get maid's last known location
   */
  static async getLocation(maidId) {
    const [rows] = await db.execute(
      'SELECT latitude, longitude, updated_at FROM maid_locations WHERE maid_id = ? ORDER BY updated_at DESC LIMIT 1',
      [maidId]
    );
    return rows[0] || null;
  }

  /**
   * Get location for a specific job's maid
   */
  static async getLocationByJobId(jobId, homeownerId) {
    const [rows] = await db.execute(
      `SELECT ml.latitude, ml.longitude, ml.updated_at, u.name as maidName
       FROM jobs j
       INNER JOIN maids m ON j.maid_id = m.maid_id
       INNER JOIN users u ON m.user_id = u.user_id
       LEFT JOIN maid_locations ml ON m.maid_id = ml.maid_id
       WHERE j.job_id = ? AND j.homeowner_id = ?`,
      [jobId, homeownerId]
    );
    return rows[0] || null;
  }
}

module.exports = LocationModel;
