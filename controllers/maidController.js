const MaidService = require('../services/maidService');
const RecommendationService = require('../services/recommendationService');
const NotificationService = require('../services/notificationService');
const Maid = require('../models/Maid');

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
 * Admin: approve a maid and send notification.
 */
const approveMaid = async (req, res) => {
  try {
    const { maidId } = req.body;
    if (!maidId) {
      return res.status(400).json({ message: 'maidId is required' });
    }

    // Get maid details before approval
    const maid = await Maid.findById(maidId).populate('user_id', 'name email');
    if (!maid) {
      return res.status(404).json({ message: 'Maid not found' });
    }

    if (maid.approval_status === 'approved') {
      return res.status(400).json({ message: 'Maid is already approved' });
    }

    // Approve the maid
    const affected = await MaidService.approveMaid(maidId);
    if (!affected) {
      return res.status(404).json({ message: 'Failed to approve maid' });
    }

    // Send approval notification
    const maidData = {
      user_id: maid.user_id._id,
      name: maid.user_id.name,
      email: maid.user_id.email
    };
    const notificationResult = await NotificationService.sendMaidApprovalNotification(maidData);

    return res.json({ 
      message: 'Maid approved successfully',
      notification: notificationResult.success ? 'Notification sent' : 'Notification failed'
    });
  } catch (err) {
    console.error('Approve maid error', err);
    return res.status(500).json({ message: 'Failed to approve maid' });
  }
};

/**
 * Admin: reject a maid (POST body).
 */
const rejectMaid = async (req, res) => {
  try {
    const { maidId, reason } = req.body;
    if (!maidId) {
      return res.status(400).json({ message: 'maidId is required' });
    }

    // Get maid details before rejection
    const maid = await Maid.findById(maidId).populate('user_id', 'name email');
    if (!maid) {
      return res.status(404).json({ message: 'Maid not found' });
    }

    // Reject the maid
    maid.approval_status = 'rejected';
    maid.rejection_reason = reason || '';
    await maid.save();

    // Send rejection notification
    const maidData = {
      user_id: maid.user_id._id,
      name: maid.user_id.name,
      email: maid.user_id.email
    };
    const notificationResult = await NotificationService.sendMaidRejectionNotification(maidData, reason);

    return res.json({ 
      message: 'Maid rejected',
      notification: notificationResult.success ? 'Notification sent' : 'Notification failed'
    });
  } catch (err) {
    console.error('Reject maid error', err);
    return res.status(500).json({ message: 'Failed to reject maid' });
  }
};

/**
 * Admin: approve a maid by ID (URL param).
 */
const approveMaidById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const maid = await Maid.findById(id).populate('user_id', 'name email');
    if (!maid) {
      return res.status(404).json({ message: 'Maid not found' });
    }

    if (maid.approval_status === 'approved') {
      return res.status(400).json({ message: 'Maid is already approved' });
    }

    // Approve the maid
    maid.approval_status = 'approved';
    maid.is_verified = true;
    await maid.save();

    // Send approval notification (in-app + email)
    const maidData = {
      user_id: maid.user_id._id,
      name: maid.user_id.name,
      email: maid.user_id.email
    };
    const notificationResult = await NotificationService.sendMaidApprovalNotification(maidData);

    return res.json({ 
      message: 'Maid approved successfully',
      emailSent: notificationResult.success,
      emailMethod: notificationResult.method || 'none'
    });
  } catch (err) {
    console.error('Approve maid by ID error', err);
    return res.status(500).json({ message: 'Failed to approve maid' });
  }
};

/**
 * Admin: reject a maid by ID (URL param).
 */
const rejectMaidById = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const maid = await Maid.findById(id).populate('user_id', 'name email');
    if (!maid) {
      return res.status(404).json({ message: 'Maid not found' });
    }

    // Reject the maid
    maid.approval_status = 'rejected';
    maid.rejection_reason = reason || '';
    await maid.save();

    // Send rejection notification (in-app + email)
    const maidData = {
      user_id: maid.user_id._id,
      name: maid.user_id.name,
      email: maid.user_id.email
    };
    const notificationResult = await NotificationService.sendMaidRejectionNotification(maidData, reason);

    return res.json({ 
      message: 'Maid rejected',
      emailSent: notificationResult.success,
      emailMethod: notificationResult.method || 'none'
    });
  } catch (err) {
    console.error('Reject maid by ID error', err);
    return res.status(500).json({ message: 'Failed to reject maid' });
  }
};

module.exports = {
  listPendingMaids,
  approveMaid,
  approveMaidById,
  rejectMaid,
  rejectMaidById,
  recommendMaids,
};
