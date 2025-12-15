/**
 * Create Admin User Script
 * Usage: node create-admin.js
 * 
 * This script creates an admin user for the HMTS system.
 * Uses MongoDB for storage.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Load environment variables
require('dotenv').config();

const User = require('./models/User');

async function createAdmin() {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/hmts';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Admin credentials
    const adminEmail = 'admin@hmts.com';
    const adminPassword = 'admin123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists with email:', adminEmail);
      console.log('   Use these credentials to login:');
      console.log('   Email:', adminEmail);
      console.log('   Password: admin123');
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const admin = await User.create({
      name: 'System Administrator',
      email: adminEmail,
      phone: '0000000000',
      password_hash: passwordHash,
      role: 'admin',
      verification_status: 'verified'
    });

    console.log('');
    console.log('✅ Admin user created successfully!');
    console.log('═'.repeat(40));
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('   User ID:', admin._id);
    console.log('═'.repeat(40));
    console.log('');
    console.log('⚠️ Please change the password after first login!');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
