const MaidService = require('../services/maidService');
const RecommendationService = require('../services/recommendationService');


/**
 * Admin: list all maids with pending approval.
 */
const listPendingMaids = async (_req, res) => {
  try {
    const maids = await MaidService.getPendingMaids();
    return res.json(maids);
  } catch (err) {
    console.error('List pending maids error', err);
    return res.status(500).json({ message: 'Failed to fetch pending maids' });
  }
};

const recommendMaids = async (req, res) => {
  try {
    const homeownerId = req.user.userId;
    const recommendations =
      await RecommendationService.getRecommendedMaidsForHomeowner(homeownerId);
    return res.json({
      message: 'Recommended maids (rule-based AI)',
      recommendations,
    });
  } catch (err) {
    console.error('Recommend maids error', err);
    return res.status(500).json({ message: 'Failed to get recommendations' });
  }
};

/**
 * Admin: approve a maid.
 */
const approveMaid = async (req, res) => {
  try {
    const { maidId } = req.body;
    if (!maidId) {
      return res.status(400).json({ message: 'maidId is required' });
    }

    const affected = await MaidService.approveMaid(maidId);
    if (!affected) {
      return res.status(404).json({ message: 'Maid not found' });
    }

    return res.json({ message: 'Maid approved successfully' });
  } catch (err) {
    console.error('Approve maid error', err);
    return res.status(500).json({ message: 'Failed to approve maid' });
  }
};

module.exports = {
  listPendingMaids,
  approveMaid,
  recommendMaids,
};