const DashboardService = require('../services/dashboardService');

/**
 * Get admin dashboard statistics
 */
const getAdminStats = async (req, res) => {
  try {
    const stats = await DashboardService.getAdminStats();
    return res.json(stats);
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return res.status(500).json({ message: 'Failed to get dashboard statistics' });
  }
};

/**
 * Get homeowner dashboard statistics
 */
const getHomeownerStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const stats = await DashboardService.getHomeownerStats(userId);
    return res.json(stats);
  } catch (error) {
    console.error('Error getting homeowner stats:', error);
    return res.status(500).json({ message: 'Failed to get dashboard statistics' });
  }
};

/**
 * Get maid dashboard statistics
 */
const getMaidStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const stats = await DashboardService.getMaidStats(userId);
    return res.json(stats);
  } catch (error) {
    console.error('Error getting maid stats:', error);
    return res.status(500).json({ message: 'Failed to get dashboard statistics' });
  }
};

/**
 * Get dashboard stats based on user role
 */
const getMyStats = async (req, res) => {
  try {
    const { userId, role } = req.user;
    let stats;
    
    switch (role) {
      case 'admin':
        stats = await DashboardService.getAdminStats();
        break;
      case 'homeowner':
        stats = await DashboardService.getHomeownerStats(userId);
        break;
      case 'maid':
        stats = await DashboardService.getMaidStats(userId);
        break;
      default:
        return res.status(400).json({ message: 'Invalid role' });
    }
    
    return res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    return res.status(500).json({ message: 'Failed to get dashboard statistics' });
  }
};

module.exports = {
  getAdminStats,
  getHomeownerStats,
  getMaidStats,
  getMyStats
};
