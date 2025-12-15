/**
 * Admin User Creation Script
 * Run this once to create an admin account in the database
 * Usage: node create-admin.js
 */

const bcrypt = require('bcrypt');
const db = require('./config/db');

async function createAdmin() {
  try {
    console.log('Creating admin user...\n');

    const adminData = {
      name: 'Administrator',
      email: 'admin@maidtrack.com',
      phone: '1234567890',
      password: 'admin123',
      role: 'admin'
    };

    // Check if admin already exists
    const [existingUsers] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [adminData.email]
    );

    if (existingUsers.length > 0) {
      console.log('❌ Admin user already exists with email:', adminData.email);
      console.log('   User ID:', existingUsers[0].user_id);
      console.log('   Name:', existingUsers[0].name);
      console.log('   Role:', existingUsers[0].role);
      console.log('\nIf you need to reset the password, delete this user from the database first.');
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminData.password, 10);

    // Insert admin user
    const [result] = await db.execute(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [adminData.name, adminData.email, adminData.phone, passwordHash, adminData.role]
    );

    console.log('✅ Admin user created successfully!\n');
    console.log('Login Credentials:');
    console.log('==================');
    console.log('Email:   ', adminData.email);
    console.log('Password:', adminData.password);
    console.log('\nUser ID:', result.insertId);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');
    console.log('You can now login at: http://localhost:4000/login.html\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdmin();
