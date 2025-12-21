/**
 * Script to recalculate all maid ratings from existing reviews
 * Run with: node fix-maid-ratings.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/maidtrack';

async function fixMaidRatings() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB');

    // Load all models
    require('./models/User');
    const Review = require('./models/Review');
    const Maid = require('./models/Maid');

    // Get all maids
    const maids = await Maid.find().populate('user_id', 'name');
    console.log(`Found ${maids.length} maids`);

    for (const maid of maids) {
      // Get all reviews for this maid (by user_id)
      const reviews = await Review.find({ reviewee_id: maid.user_id._id });
      
      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        const roundedRating = Math.round(avgRating * 10) / 10;
        
        await Maid.findByIdAndUpdate(maid._id, {
          average_rating: roundedRating,
          total_reviews: reviews.length
        });
        
        console.log(`Updated ${maid.user_id.name}: ${reviews.length} reviews, avg rating: ${roundedRating}`);
      } else {
        console.log(`${maid.user_id.name}: No reviews found`);
      }
    }

    console.log('\nDone! All maid ratings have been recalculated.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixMaidRatings();
