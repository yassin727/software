const express = require('express');
const { body } = require('express-validator');
const ReviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// POST /api/reviews → create review
router.post(
  '/',
  auth(['homeowner']),
  validate([
    body('jobId').notEmpty().withMessage('jobId is required').isInt().withMessage('jobId must be an integer'),
    body('revieweeId').notEmpty().withMessage('revieweeId is required').isInt().withMessage('revieweeId must be an integer'),
    body('rating')
      .notEmpty()
      .withMessage('rating is required')
      .isInt({ min: 1, max: 5 })
      .withMessage('rating must be between 1 and 5'),
  ]),
  ReviewController.createReview
);

// Optional: list reviews for a maid
// GET /api/reviews/maid/:maidUserId
router.get('/maid/:maidUserId', auth(['admin', 'homeowner', 'maid']), ReviewController.listReviewsForMaid);

module.exports = router;