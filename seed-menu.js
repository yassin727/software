const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

const Menu = require('./models/Menu');

/**
 * Seed menu items for all roles
 */
async function seedMenu() {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/hmts';
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Clear existing menu items
    await Menu.deleteMany({});
    console.log('🗑️ Cleared existing menu items');

    // Admin menu items
    const adminDashboard = await Menu.create({
      title: 'Dashboard',
      path: '/admin/dashboard.html',
      icon: 'dashboard',
      role: 'admin',
      sort_order: 1
    });

    await Menu.create({
      title: 'Pending Maids',
      path: '/admin/pending-maids.html',
      icon: 'pending',
      role: 'admin',
      sort_order: 2
    });

    await Menu.create({
      title: 'All Users',
      path: '/admin/users.html',
      icon: 'people',
      role: 'admin',
      sort_order: 3
    });

    await Menu.create({
      title: 'Verifications',
      path: '/admin/verifications.html',
      icon: 'verified_user',
      role: 'admin',
      sort_order: 4
    });

    await Menu.create({
      title: 'Reports',
      path: '/admin/reports.html',
      icon: 'assessment',
      parent_id: adminDashboard._id,
      role: 'admin',
      sort_order: 5
    });

    // Homeowner menu items
    await Menu.create({
      title: 'Dashboard',
      path: '/homeowner/dashboard.html',
      icon: 'home',
      role: 'homeowner',
      sort_order: 1
    });

    await Menu.create({
      title: 'My Jobs',
      path: '/homeowner/jobs.html',
      icon: 'work',
      role: 'homeowner',
      sort_order: 2
    });

    await Menu.create({
      title: 'Find Maids',
      path: '/homeowner/find-maids.html',
      icon: 'search',
      role: 'homeowner',
      sort_order: 3
    });

    await Menu.create({
      title: 'Reviews',
      path: '/homeowner/reviews.html',
      icon: 'star',
      role: 'homeowner',
      sort_order: 4
    });

    // Maid menu items
    await Menu.create({
      title: 'Dashboard',
      path: '/maid/dashboard.html',
      icon: 'dashboard',
      role: 'maid',
      sort_order: 1
    });

    await Menu.create({
      title: 'My Jobs',
      path: '/maid/jobs.html',
      icon: 'work',
      role: 'maid',
      sort_order: 2
    });

    await Menu.create({
      title: 'Attendance',
      path: '/maid/attendance.html',
      icon: 'schedule',
      role: 'maid',
      sort_order: 3
    });

    await Menu.create({
      title: 'My Reviews',
      path: '/maid/reviews.html',
      icon: 'star',
      role: 'maid',
      sort_order: 4
    });

    // Common menu items (all roles)
    await Menu.create({
      title: 'Profile',
      path: '/profile.html',
      icon: 'person',
      role: 'all',
      sort_order: 100
    });

    await Menu.create({
      title: 'Settings',
      path: '/settings.html',
      icon: 'settings',
      role: 'all',
      sort_order: 101
    });

    console.log('✅ Menu items seeded successfully');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error seeding menu:', error);
    process.exit(1);
  }
}

seedMenu();
