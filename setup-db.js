/**
 * Database Setup Script for MongoDB
 * Usage: node setup-db.js
 * 
 * This script:
 * 1. Connects to MongoDB
 * 2. Creates indexes
 * 3. Seeds initial data (admin user, menu items)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Load environment variables
require('dotenv').config();

// Import models
const User = require('./models/User');
const Maid = require('./models/Maid');
const Job = require('./models/Job');
const Review = require('./models/Review');
const Attendance = require('./models/Attendance');
const Notification = require('./models/Notification');
const Menu = require('./models/Menu');
const Location = require('./models/Location');

async function setupDatabase() {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/hmts';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Ensure indexes are created
    console.log('📇 Creating indexes...');
    await User.createIndexes();
    await Maid.createIndexes();
    await Job.createIndexes();
    await Review.createIndexes();
    await Attendance.createIndexes();
    await Notification.createIndexes();
    await Menu.createIndexes();
    await Location.createIndexes();
    console.log('✅ Indexes created');

    // Check if admin exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      console.log('👤 Creating admin user...');
      const passwordHash = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'System Admin',
        email: 'admin@hmts.com',
        phone: '0000000000',
        password_hash: passwordHash,
        role: 'admin',
        verification_status: 'verified'
      });
      console.log('✅ Admin user created (admin@hmts.com / admin123)');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Check if menu items exist
    const menuCount = await Menu.countDocuments();
    if (menuCount === 0) {
      console.log('📋 Seeding menu items...');
      await seedMenuItems();
      console.log('✅ Menu items seeded');
    } else {
      console.log('ℹ️ Menu items already exist');
    }

    // Print stats
    console.log('');
    console.log('📊 Database Statistics:');
    console.log('   Users:', await User.countDocuments());
    console.log('   Maids:', await Maid.countDocuments());
    console.log('   Jobs:', await Job.countDocuments());
    console.log('   Reviews:', await Review.countDocuments());
    console.log('   Menu Items:', await Menu.countDocuments());

    await mongoose.disconnect();
    console.log('');
    console.log('✅ Database setup complete!');
  } catch (error) {
    console.error('❌ Setup error:', error.message);
    process.exit(1);
  }
}

async function seedMenuItems() {
  // Admin menus
  await Menu.create([
    { title: 'Dashboard', path: '/admin/dashboard.html', icon: 'dashboard', role: 'admin', sort_order: 1 },
    { title: 'Pending Maids', path: '/admin/pending-maids.html', icon: 'pending', role: 'admin', sort_order: 2 },
    { title: 'All Users', path: '/admin/users.html', icon: 'people', role: 'admin', sort_order: 3 },
    { title: 'Verifications', path: '/admin/verifications.html', icon: 'verified_user', role: 'admin', sort_order: 4 }
  ]);

  // Homeowner menus
  await Menu.create([
    { title: 'Dashboard', path: '/homeowner/dashboard.html', icon: 'home', role: 'homeowner', sort_order: 1 },
    { title: 'My Jobs', path: '/homeowner/jobs.html', icon: 'work', role: 'homeowner', sort_order: 2 },
    { title: 'Find Maids', path: '/homeowner/find-maids.html', icon: 'search', role: 'homeowner', sort_order: 3 },
    { title: 'Reviews', path: '/homeowner/reviews.html', icon: 'star', role: 'homeowner', sort_order: 4 }
  ]);

  // Maid menus
  await Menu.create([
    { title: 'Dashboard', path: '/maid/dashboard.html', icon: 'dashboard', role: 'maid', sort_order: 1 },
    { title: 'My Jobs', path: '/maid/jobs.html', icon: 'work', role: 'maid', sort_order: 2 },
    { title: 'Attendance', path: '/maid/attendance.html', icon: 'schedule', role: 'maid', sort_order: 3 },
    { title: 'My Reviews', path: '/maid/reviews.html', icon: 'star', role: 'maid', sort_order: 4 }
  ]);

  // Common menus
  await Menu.create([
    { title: 'Profile', path: '/profile.html', icon: 'person', role: 'all', sort_order: 100 },
    { title: 'Settings', path: '/settings.html', icon: 'settings', role: 'all', sort_order: 101 }
  ]);
}

setupDatabase();
