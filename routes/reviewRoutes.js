const express = require('express');
const { listReviewsForMaid, createReview } = require('../controllers/reviewController');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.get('/maid/:maidId', listReviewsForMaid);
router.post('/', authenticate, createReview);

module.exports = router;

