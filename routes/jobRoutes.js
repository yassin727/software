const express = require('express');
const { body } = require('express-validator');
const JobController = require('../controllers/jobController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// POST /api/jobs  (homeowner creates job)
router.post(
  '/',
  auth(['homeowner']),
  validate([
    body('maidId').notEmpty().withMessage('maidId is required'),
    body('title').notEmpty().withMessage('title is required'),
    body('address').notEmpty().withMessage('address is required'),
    body('scheduledDatetime').notEmpty().withMessage('scheduledDatetime is required').isISO8601().withMessage('scheduledDatetime must be ISO date/time'),
    body('hourlyRate').notEmpty().withMessage('hourlyRate is required').isFloat({ gt: 0 }).withMessage('hourlyRate must be > 0'),
  ]),
  JobController.createJob
);

// GET /api/jobs/my  (homeowner & maid see their jobs)
router.get('/my', auth(['homeowner', 'maid']), JobController.listJobs);

// POST /api/jobs/checkin  (maid)
router.post(
  '/checkin',
  auth(['maid']),
  validate([
    body('jobId').notEmpty().withMessage('jobId is required'),
  ]),
  JobController.checkIn
);

// POST /api/jobs/checkout  (maid)
router.post(
  '/checkout',
  auth(['maid']),
  validate([
    body('attendanceId').notEmpty().withMessage('attendanceId is required'),
    body('jobId').notEmpty().withMessage('jobId is required'),
  ]),
  JobController.checkOut
);

// GET /api/jobs/:jobId - Get job details with tasks and progress
router.get('/:jobId', auth(['homeowner', 'maid', 'admin']), JobController.getJobDetails);

// PUT /api/jobs/:jobId/progress - Update job tasks and progress (maid can update progress, homeowner can edit tasks)
router.put(
  '/:jobId/progress',
  auth(['maid', 'homeowner']),
  validate([
    body('progress_percentage').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
    body('progress_note').optional().isString().trim(),
  ]),
  JobController.updateJobProgress
);

// Optional: admin update job status
router.patch('/:jobId/status', auth(['admin']), JobController.updateJobStatus);

module.exports = router;