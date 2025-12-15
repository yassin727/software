const express = require('express');
const { body } = require('express-validator');
const LocationController = require('../controllers/locationController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// POST /api/location/update - Maid updates their location
router.post(
  '/update',
  auth(['maid']),
  validate([
    body('latitude').notEmpty().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('longitude').notEmpty().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
  ]),
  LocationController.updateLocation
);

// GET /api/location/job/:jobId - Homeowner views maid location for their job
router.get('/job/:jobId', auth(['homeowner']), LocationController.getMaidLocation);

module.exports = router;
