const express = require('express');
const { listJobs, createJob, updateJobStatus } = require('../controllers/jobController');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, listJobs);
router.post('/', authenticate, createJob);
router.patch('/:jobId/status', authenticate, updateJobStatus);

module.exports = router;

