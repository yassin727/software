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

// ============================================================
// Reports
// ============================================================

// GET /api/admin/reports/summary - Get reports summary
router.get('/reports/summary', auth(['admin']), AdminController.getReportsSummary);

// GET /api/admin/reports/performance - Get performance data for charts
router.get('/reports/performance', auth(['admin']), AdminController.getPerformanceData);

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

module.exports = router;
