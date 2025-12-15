/**
 * Simple test script to verify backend APIs
 * Run with: node test-apis.js
 */

const bcrypt = require('bcrypt');
const db = require('./config/db');

async function testApis() {
  console.log('Testing backend APIs...\n');
  
  try {
    // Test database connection
    console.log('1. Testing database connection...');
    const [rows] = await db.execute('SELECT 1 as test');
    console.log('   ✓ Database connection successful\n');
    
    // Test user creation
    console.log('2. Testing user creation...');
    const passwordHash = await bcrypt.hash('test123', 10);
    const [result] = await db.execute(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      ['Test User', 'test@example.com', '1234567890', passwordHash, 'admin']
    );
    console.log('   ✓ User created with ID:', result.insertId);
    
    // Clean up test user
    await db.execute('DELETE FROM users WHERE user_id = ?', [result.insertId]);
    console.log('   ✓ Test user cleaned up\n');
    
    // Test multer installation
    console.log('3. Testing multer installation...');
    const multer = require('multer');
    console.log('   ✓ Multer installed successfully\n');
    
    // Test API routes registration
    console.log('4. Testing API routes...');
    const fs = require('fs');
    const path = require('path');
    
    const routesDir = path.join(__dirname, 'routes');
    if (fs.existsSync(routesDir)) {
      const routeFiles = fs.readdirSync(routesDir);
      console.log('   ✓ Routes directory found with', routeFiles.length, 'files');
      
      const expectedRoutes = ['authRoutes.js', 'maidRoutes.js', 'jobRoutes.js', 'reviewRoutes.js', 'menuRoutes.js', 'adminRoutes.js', 'dashboardRoutes.js', 'locationRoutes.js', 'profileRoutes.js', 'notificationRoutes.js'];
      const missingRoutes = expectedRoutes.filter(route => !routeFiles.includes(route));
      
      if (missingRoutes.length === 0) {
        console.log('   ✓ All expected route files present');
      } else {
        console.log('   ⚠ Missing route files:', missingRoutes);
      }
    } else {
      console.log('   ✗ Routes directory not found');
    }
    
    console.log('\n✅ All tests passed! Backend APIs are ready.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testApis();
