const Maid = require('../models/Maid');
const User = require('../models/User');

class MaidService {
  static async getPendingMaids() {
    return await Maid.find({ approval_status: 'pending' })
      .populate('user_id', 'name email phone')
      .lean();
  }

  static async approveMaid(maidId) {
    const result = await Maid.findByIdAndUpdate(
      maidId, 
      { approval_status: 'approved' },
      { new: true }
    );
    return result ? 1 : 0; // Return 1 for success, 0 for failure (to match old API)
  }

  static async getActiveMaids() {
    return await Maid.find({ approval_status: 'approved' })
      .populate('user_id', 'name email phone photo_url')
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get maid profile by user ID
   */
  static async getMaidByUserId(userId) {
    return await Maid.findOne({ user_id: userId });
  }

  /**
   * Update maid profile with detailed information
   */
  static async updateMaidProfile(maidId, profileData) {
    const {
      specializations,
      hourly_rate,
      experience_years,
      location,
      bio
    } = profileData;

    const updateData = {};
    if (specializations) updateData.specializations = specializations;
    if (hourly_rate !== undefined) updateData.hourly_rate = hourly_rate;
    if (experience_years !== undefined) updateData.experience_years = experience_years;
    if (location) updateData.location = location;
    if (bio) updateData.bio = bio;

    return await Maid.findByIdAndUpdate(
      maidId,
      { $set: updateData },
      { new: true }
    );
  }
}

module.exports = MaidService;