const Maid = require('../models/Maid');
const Job = require('../models/Job');
const Review = require('../models/Review');

/**
 * STRATEGY PATTERN IMPLEMENTATION
 * 
 * The Strategy Pattern defines a family of algorithms, encapsulates each one,
 * and makes them interchangeable. This allows the algorithm to vary independently
 * from clients that use it.
 */

// ============================================================
// Strategy Interface (Abstract)
// ============================================================

/**
 * Abstract Strategy class - defines the interface for recommendation algorithms
 */
class RecommendationStrategy {
  /**
   * Get recommended maids based on the strategy
   * @param {string} homeownerId - The homeowner requesting recommendations
   * @param {number} limit - Maximum number of recommendations
   * @returns {Promise<Array>} Array of recommended maids with scores
   */
  async getRecommendations(homeownerId, limit) {
    throw new Error('Strategy method getRecommendations() must be implemented');
  }
  
  /**
   * Get the name of this strategy
   * @returns {string} Strategy name
   */
  getName() {
    throw new Error('Strategy method getName() must be implemented');
  }
}

// ============================================================
// Concrete Strategies
// ============================================================

/**
 * Concrete Strategy 1: Rating-Based Recommendations
 * Recommends maids based on their average rating
 */
class RatingBasedStrategy extends RecommendationStrategy {
  async getRecommendations(homeownerId, limit) {
    const maids = await Maid.find({ approval_status: 'approved' })
      .populate('user_id', 'name email phone')
      .lean();
    
    const scoredMaids = await Promise.all(maids.map(async (maid) => {
      const reviews = await Review.find({ reviewee_id: maid.user_id?._id }).lean();
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
      
      return {
        maidId: maid._id,
        maidUserId: maid.user_id?._id,
        name: maid.user_id?.name || 'Unknown',
        email: maid.user_id?.email || '',
        specializations: maid.specializations,
        hourlyRate: maid.hourly_rate,
        avgRating: parseFloat(avgRating.toFixed(2)),
        reviewCount: reviews.length,
        score: avgRating, // Score is just the rating
        strategy: 'rating'
      };
    }));
    
    return scoredMaids
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  getName() {
    return 'Rating-Based Strategy';
  }
}

/**
 * Concrete Strategy 2: Experience-Based Recommendations
 * Recommends maids based on completed jobs count
 */
class ExperienceBasedStrategy extends RecommendationStrategy {
  async getRecommendations(homeownerId, limit) {
    const maids = await Maid.find({ approval_status: 'approved' })
      .populate('user_id', 'name email phone')
      .lean();
    
    const scoredMaids = await Promise.all(maids.map(async (maid) => {
      const completedJobs = await Job.countDocuments({
        maid_id: maid._id,
        status: 'completed'
      });
      
      const reviews = await Review.find({ reviewee_id: maid.user_id?._id }).lean();
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
      
      return {
        maidId: maid._id,
        maidUserId: maid.user_id?._id,
        name: maid.user_id?.name || 'Unknown',
        email: maid.user_id?.email || '',
        specializations: maid.specializations,
        hourlyRate: maid.hourly_rate,
        avgRating: parseFloat(avgRating.toFixed(2)),
        completedJobs,
        score: completedJobs, // Score is job count
        strategy: 'experience'
      };
    }));
    
    return scoredMaids
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  getName() {
    return 'Experience-Based Strategy';
  }
}

/**
 * Concrete Strategy 3: Hybrid Scoring (AI-like weighted algorithm)
 * Combines rating and experience with weighted scoring
 */
class HybridScoringStrategy extends RecommendationStrategy {
  constructor(ratingWeight = 2, experienceWeight = 0.5) {
    super();
    this.ratingWeight = ratingWeight;
    this.experienceWeight = experienceWeight;
  }
  
  async getRecommendations(homeownerId, limit) {
    const maids = await Maid.find({ approval_status: 'approved' })
      .populate('user_id', 'name email phone')
      .lean();
    
    const scoredMaids = await Promise.all(maids.map(async (maid) => {
      const maidUserId = maid.user_id?._id;
      
      // Get reviews for rating calculation
      const reviews = await Review.find({ reviewee_id: maidUserId }).lean();
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
      
      // Get completed jobs count
      const completedJobs = await Job.countDocuments({
        maid_id: maid._id,
        status: 'completed'
      });
      
      // Weighted scoring formula (AI-like)
      const score = (avgRating * this.ratingWeight) + (completedJobs * this.experienceWeight);
      
      return {
        maidId: maid._id,
        maidUserId,
        name: maid.user_id?.name || 'Unknown',
        email: maid.user_id?.email || '',
        specializations: maid.specializations,
        hourlyRate: maid.hourly_rate,
        avgRating: parseFloat(avgRating.toFixed(2)),
        completedJobs,
        score: parseFloat(score.toFixed(2)),
        strategy: 'hybrid'
      };
    }));
    
    return scoredMaids
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  getName() {
    return 'Hybrid Scoring Strategy (AI-weighted)';
  }
}

/**
 * Concrete Strategy 4: Location-Based Recommendations
 * Recommends maids based on proximity (if location data available)
 */
class LocationBasedStrategy extends RecommendationStrategy {
  async getRecommendations(homeownerId, limit) {
    // For now, fall back to hybrid since location matching requires more data
    const hybridStrategy = new HybridScoringStrategy();
    const results = await hybridStrategy.getRecommendations(homeownerId, limit);
    
    // Mark as location-based
    return results.map(r => ({ ...r, strategy: 'location' }));
  }
  
  getName() {
    return 'Location-Based Strategy';
  }
}

// ============================================================
// Context Class (Uses Strategy)
// ============================================================

/**
 * RecommendationService - Context class that uses a strategy
 * 
 * This is the main service class that clients interact with.
 * It delegates the recommendation algorithm to the current strategy.
 */
class RecommendationService {
  // Default strategy
  static strategy = new HybridScoringStrategy();
  
  // Available strategies registry
  static strategies = {
    'rating': new RatingBasedStrategy(),
    'experience': new ExperienceBasedStrategy(),
    'hybrid': new HybridScoringStrategy(),
    'location': new LocationBasedStrategy()
  };
  
  /**
   * Set the recommendation strategy
   * @param {RecommendationStrategy|string} strategy - Strategy instance or name
   */
  static setStrategy(strategy) {
    if (typeof strategy === 'string') {
      if (this.strategies[strategy]) {
        this.strategy = this.strategies[strategy];
      } else {
        throw new Error(`Unknown strategy: ${strategy}`);
      }
    } else if (strategy instanceof RecommendationStrategy) {
      this.strategy = strategy;
    } else {
      throw new Error('Invalid strategy');
    }
  }
  
  /**
   * Get the current strategy name
   * @returns {string} Current strategy name
   */
  static getCurrentStrategyName() {
    return this.strategy.getName();
  }
  
  /**
   * Get available strategy names
   * @returns {Array<string>} List of available strategies
   */
  static getAvailableStrategies() {
    return Object.keys(this.strategies);
  }
  
  /**
   * Get recommended maids for a homeowner using the current strategy
   * @param {string} homeownerId - Homeowner ID
   * @param {number} limit - Maximum recommendations
   * @returns {Promise<Array>} Recommended maids
   */
  static async getRecommendedMaidsForHomeowner(homeownerId, limit = 5) {
    return await this.strategy.getRecommendations(homeownerId, limit);
  }
  
  /**
   * Get recommendations using a specific strategy (without changing default)
   * @param {string} strategyName - Strategy name
   * @param {string} homeownerId - Homeowner ID
   * @param {number} limit - Maximum recommendations
   * @returns {Promise<Array>} Recommended maids
   */
  static async getRecommendationsWithStrategy(strategyName, homeownerId, limit = 5) {
    const strategy = this.strategies[strategyName];
    if (!strategy) {
      throw new Error(`Unknown strategy: ${strategyName}`);
    }
    return await strategy.getRecommendations(homeownerId, limit);
  }
}

module.exports = RecommendationService;
