const db = require('../config/db');

class AttendanceModel {
  static async checkIn(jobId) {
    const [result] = await db.execute(
      'INSERT INTO attendance (job_id, check_in_time) VALUES (?, NOW())',
      [jobId]
    );
    return result.insertId;
  }

  static async checkOut(attendanceId) {
    const [result] = await db.execute(
      `UPDATE attendance
       SET check_out_time = NOW(),
           duration_minutes = TIMESTAMPDIFF(MINUTE, check_in_time, NOW())
       WHERE attendance_id = ?`,
      [attendanceId]
    );

    if (!result.affectedRows) return null;

    const [rows] = await db.execute('SELECT * FROM attendance WHERE attendance_id = ?', [attendanceId]);
    return rows[0];
  }
}

module.exports = AttendanceModel;

