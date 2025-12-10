const reviewModel = require('../models/reviewModel');

const listReviewsForMaid = async (req, res) => {
  try {
    const { maidId } = req.params;
    const reviews = await reviewModel.getReviewsForMaid(maidId);
    return res.json(reviews);
  } catch (err) {
    console.error('List reviews error', err);
    return res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};

const createReview = async (req, res) => {
  try {
    const { maid_id, homeowner_id, rating, comment } = req.body;
    if (!maid_id || !homeowner_id || !rating) {
      return res.status(400).json({ message: 'maid_id, homeowner_id, and rating are required' });
    }
    const review = await reviewModel.createReview({ maid_id, homeowner_id, rating, comment });
    return res.status(201).json(review);
  } catch (err) {
    console.error('Create review error', err);
    return res.status(500).json({ message: 'Failed to create review' });
  }
};

module.exports = {
  listReviewsForMaid,
  createReview,
};

