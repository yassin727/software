const express = require('express');
const AdminController = require('../controllers/adminController');
const MaidController = require('../controllers/maidController');
const auth = require('../middleware/auth');

const router = express.Router();

// ============================================================
// Dashboard
// ============================================================

// GET /api/admin/dashboard - Get dashboard stats and data
router.get('/dashboard', auth(['admin']), AdminController.getDashboard);

// DEBUG: Get database counts
router.get('/debug/counts', auth(['admin']), async (req, res) => {
  try {
    const User = require('../models/User');
    const Maid = require('../models/Maid');
    const Job = require('../models/Job');
    
    const counts = {
      totalUsers: await User.countDocuments(),
      totalMaids: await Maid.countDocuments(),
      approvedMaids: await Maid.countDocuments({ approval_status: 'approved' }),
      pendingMaids: await Maid.countDocuments({ approval_status: 'pending' }),
      totalJobs: await Job.countDocuments(),
      completedJobs: await Job.countDocuments({ status: 'completed' }),
      requestedJobs: await Job.countDocuments({ status: 'requested' }),
      acceptedJobs: await Job.countDocuments({ status: 'accepted' }),
      inProgressJobs: await Job.countDocuments({ status: 'in_progress' })
    };
    
    res.json(counts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Jobs Management
// ============================================================

// GET /api/admin/jobs - Get all jobs
router.get('/jobs', auth(['admin']), AdminController.getAllJobs);

// ============================================================
// Reports
// ============================================================

// GET /api/admin/reports/summary - Get reports summary
router.get('/reports/summary', auth(['admin']), AdminController.getReportsSummary);

// GET /api/admin/reports/performance - Get performance data for charts
router.get('/reports/performance', auth(['admin']), AdminController.getPerformanceData);

// GET /api/admin/reports/reviews - Get recent reviews
router.get('/reports/reviews', auth(['admin']), AdminController.getRecentReviews);

// ============================================================
// Schedule
// ============================================================

// GET /api/admin/schedule - Get calendar events
router.get('/schedule', auth(['admin']), AdminController.getSchedule);

// ============================================================
// Attendance
// ============================================================

// GET /api/admin/attendance - Get attendance records
router.get('/attendance', auth(['admin']), AdminController.getAttendance);

// ============================================================
// Settings
// ============================================================

// GET /api/admin/settings/profile - Get admin profile
router.get('/settings/profile', auth(['admin']), AdminController.getProfile);

// PUT /api/admin/settings/profile - Update admin profile
router.put('/settings/profile', auth(['admin']), AdminController.updateProfile);

// PUT /api/admin/settings/password - Change password
router.put('/settings/password', auth(['admin']), AdminController.changePassword);

// ============================================================
// Maid Approval Management
// ============================================================

// GET /api/admin/maids/pending - Get pending maids
router.get('/maids/pending', auth(['admin']), MaidController.listPendingMaids);

// PUT /api/admin/maids/:id/approve - Approve a maid
router.put('/maids/:id/approve', auth(['admin']), MaidController.approveMaidById);

// PUT /api/admin/maids/:id/reject - Reject a maid
router.put('/maids/:id/reject', auth(['admin']), MaidController.rejectMaidById);

// POST /api/admin/maids/approve - Approve a maid (legacy)
router.post('/maids/approve', auth(['admin']), MaidController.approveMaid);

// POST /api/admin/maids/reject - Reject a maid (legacy)
router.post('/maids/reject', auth(['admin']), MaidController.rejectMaid);

// ============================================================
// Notifications
// ============================================================

// GET /api/admin/notifications - Get all notifications
router.get('/notifications', auth(['admin']), AdminController.getNotifications);

// GET /api/admin/notifications/pending - Get pending notifications
router.get('/notifications/pending', auth(['admin']), AdminController.getPendingNotifications);

// ============================================================
// Verifications
// ============================================================

// GET /api/admin/verifications/pending - Get pending verifications
router.get('/verifications/pending', auth(['admin']), AdminController.getPendingVerifications);

// POST /api/admin/verifications/process - Process verification
router.post('/verifications/process', auth(['admin']), AdminController.processVerification);

// ============================================================
// Email Testing (Admin Only)
// ============================================================
const EmailService = require('../services/emailService');

// GET /api/admin/email/status - Get email configuration status
router.get('/email/status', auth(['admin']), async (_req, res) => {
  const status = EmailService.getConfigStatus();
  const verification = await EmailService.verifyConnection();
  res.json({ ...status, ...verification });
});

// POST /api/admin/email/test - Send a test email
router.post('/email/test', auth(['admin']), async (req, res) => {
  const { to } = req.body;
  if (!to) {
    return res.status(400).json({ message: 'Email address (to) is required' });
  }
  const result = await EmailService.sendTestEmail(to);
  res.json(result);
});

module.exports = router;
