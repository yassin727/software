const MaidModel = require('../models/maidModel');

class MaidService {
  static async getPendingMaids() {
    return MaidModel.getPending();
  }

  static async approveMaid(maidId) {
    return MaidModel.approve(maidId);
  }
}

module.exports = MaidService;