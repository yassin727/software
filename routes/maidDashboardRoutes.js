const express = require('express');
const MaidDashboardController = require('../controllers/maidDashboardController');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/maid/dashboard - Get dashboard data (stats, schedule, reviews)
router.get('/dashboard', auth(['maid']), MaidDashboardController.getDashboard);

// GET /api/maid/job-requests - Get pending job requests
router.get('/job-requests', auth(['maid']), MaidDashboardController.getJobRequests);

// GET /api/maid/jobs - Get maid's jobs with optional status filter
router.get('/jobs', auth(['maid']), MaidDashboardController.getMyJobs);

// PUT /api/maid/availability - Update online/offline status
router.put('/availability', auth(['maid']), MaidDashboardController.updateAvailability);

// GET /api/maid/earnings - Get earnings with optional range filter
router.get('/earnings', auth(['maid']), MaidDashboardController.getEarnings);

// GET /api/maid/reviews - Get maid's reviews
router.get('/reviews', auth(['maid']), MaidDashboardController.getReviews);

// POST /api/maid/jobs/accept - Accept a job request
router.post('/jobs/accept', auth(['maid']), MaidDashboardController.acceptJob);

// POST /api/maid/jobs/decline - Decline a job request
router.post('/jobs/decline', auth(['maid']), MaidDashboardController.declineJob);

module.exports = router;
