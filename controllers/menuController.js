const Menu = require('../models/Menu');

/**
 * Build nested menu tree from flat array
 * @param {Array} items - Flat array of menu items
 * @param {string|null} parentId - Parent ID to filter by
 * @returns {Array} Nested menu tree
 */
const buildMenuTree = (items, parentId = null) => {
  const result = [];
  
  for (const item of items) {
    const itemParentId = item.parent_id ? item.parent_id.toString() : null;
    const compareParentId = parentId ? parentId.toString() : null;
    
    if (itemParentId === compareParentId) {
      const children = buildMenuTree(items, item._id.toString());
      const menuItem = {
        id: item._id,
        title: item.title,
        path: item.path,
        icon: item.icon,
        sortOrder: item.sort_order
      };
      
      if (children.length > 0) {
        menuItem.children = children;
      }
      
      result.push(menuItem);
    }
  }
  
  return result.sort((a, b) => a.sortOrder - b.sortOrder);
};

const getMyMenu = async (req, res) => {
  try {
    const role = req.user.role;
    
    // Get menu items for this role or 'all'
    const menuItems = await Menu.find({
      $or: [{ role: role }, { role: 'all' }]
    }).sort({ sort_order: 1 });
    
    // Build nested tree
    const menuTree = buildMenuTree(menuItems);
    
    return res.json(menuTree);
  } catch (err) {
    console.error('Get menu error:', err);
    return res.status(500).json({ message: 'Failed to load menu' });
  }
};

module.exports = {
  getMyMenu,
};
