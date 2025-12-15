const express = require('express');
const HomeownerController = require('../controllers/homeownerController');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/homeowner/dashboard - Get dashboard data (stats, schedule, activity)
router.get('/dashboard', auth(['homeowner']), HomeownerController.getDashboard);

// GET /api/homeowner/maids - Search maids with filters
router.get('/maids', auth(['homeowner']), HomeownerController.searchMaids);

// GET /api/homeowner/maids/:id - Get maid profile
router.get('/maids/:id', auth(['homeowner']), HomeownerController.getMaidProfile);

// GET /api/homeowner/bookings - Get all bookings with optional status filter
router.get('/bookings', auth(['homeowner']), HomeownerController.getBookings);

// GET /api/homeowner/bookings/:id - Get single booking details
router.get('/bookings/:id', auth(['homeowner']), HomeownerController.getBookingById);

// GET /api/homeowner/history - Get service history
router.get('/history', auth(['homeowner']), HomeownerController.getHistory);

module.exports = router;
