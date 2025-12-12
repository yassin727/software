const MenuModel = require('../models/menuModel');

const getMyMenu = async (req, res) => {
  try {
    const role = req.user.role;
    const menuTree = await MenuModel.getMenuForRole(role);
    return res.json(menuTree);
  } catch (err) {
    console.error('Get menu error:', err);
    return res.status(500).json({ message: 'Failed to load menu' });
  }
};

module.exports = {
  getMyMenu,
};