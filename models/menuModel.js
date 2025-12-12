const db = require('../config/db');

class MenuModel {
  /**
   * Returns flat menu items visible for the given role.
   */
  static async getFlatMenuForRole(role) {
    const [rows] = await db.execute(
      `
      SELECT menu_id, title, path, icon, parent_id, role, sort_order
      FROM menus
      WHERE role = ? OR role = 'all'
      ORDER BY sort_order ASC, menu_id ASC
      `,
      [role]
    );
    return rows;
  }

  /**
   * Builds a tree from a flat list of menu items.
   */
  static buildTree(items) {
    const map = new Map();
    const roots = [];

    items.forEach((item) => {
      item.children = [];
      map.set(item.menu_id, item);
    });

    items.forEach((item) => {
      if (item.parent_id) {
        const parent = map.get(item.parent_id);
        if (parent) {
          parent.children.push(item);
        } else {
          roots.push(item);
        }
      } else {
        roots.push(item);
      }
    });

    return roots;
  }

  /**
   * Returns a nested tree of menu items for the given role.
   */
  static async getMenuForRole(role) {
    const flat = await this.getFlatMenuForRole(role);
    return this.buildTree(flat);
  }
}

module.exports = MenuModel;