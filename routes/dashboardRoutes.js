const express = require('express');
const DashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/my - Get stats for current user based on role
router.get('/my', auth(['admin', 'homeowner', 'maid']), DashboardController.getMyStats);

// GET /api/dashboard/admin - Admin-only stats
router.get('/admin', auth(['admin']), DashboardController.getAdminStats);

// GET /api/dashboard/homeowner - Homeowner stats
router.get('/homeowner', auth(['homeowner']), DashboardController.getHomeownerStats);

// GET /api/dashboard/maid - Maid stats
router.get('/maid', auth(['maid']), DashboardController.getMaidStats);

module.exports = router;
