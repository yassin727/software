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
}

module.exports = MaidService;