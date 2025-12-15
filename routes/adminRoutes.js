const express = require('express');
const AdminController = require('../controllers/adminController');
const MaidController = require('../controllers/maidController');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/notifications - Get all notifications (admin only)
router.get('/notifications', auth(['admin']), AdminController.getNotifications);

// GET /api/admin/notifications/pending - Get pending notifications (admin only)
router.get('/notifications/pending', auth(['admin']), AdminController.getPendingNotifications);

// POST /api/admin/maids/reject - Reject a maid (admin only)
router.post('/maids/reject', auth(['admin']), MaidController.rejectMaid);

// GET /api/admin/verifications/pending - Get pending verifications (admin only)
router.get('/verifications/pending', auth(['admin']), AdminController.getPendingVerifications);

// POST /api/admin/verifications/process - Process verification (admin only)
router.post('/verifications/process', auth(['admin']), AdminController.processVerification);

module.exports = router;
