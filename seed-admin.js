const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Load environment variables
require('dotenv').config();

const User = require('./models/User');

async function createAdmin() {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/hmts';
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@hmts.com' });
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists');
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@hmts.com',
      phone: '1234567890',
      password_hash: passwordHash,
      role: 'admin',
      verification_status: 'verified'
    });

    console.log('✅ Admin user created successfully');
    console.log('   Email: admin@hmts.com');
    console.log('   Password: admin123');
    console.log('   ID:', admin._id);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
