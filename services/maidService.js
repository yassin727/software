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
}

module.exports = MaidService;