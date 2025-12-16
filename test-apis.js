/**
 * API Test Script
 * Usage: node test-apis.js
 * 
 * Tests the main API endpoints to verify they're working.
 * Requires the server to be running.
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.API_URL || 'http://localhost:4000';

async function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testApis() {
  console.log('🧪 Testing HMTS APIs...');
  console.log('Base URL:', BASE_URL);
  console.log('');

  let token = null;

  // Test 1: Health check (root)
  console.log('1️⃣ Testing root endpoint...');
  try {
    const res = await makeRequest('GET', '/');
    console.log('   Status:', res.status);
    console.log('   ✅ Root endpoint working');
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
  }

  // Test 2: Login
  console.log('');
  console.log('2️⃣ Testing login...');
  try {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@hmts.com',
      password: 'admin123'
    });
    console.log('   Status:', res.status);
    if (res.data.token) {
      token = res.data.token;
      console.log('   ✅ Login successful, got token');
    } else {
      console.log('   ⚠️ Login response:', res.data);
    }
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
  }

  // Test 3: Get menu (requires auth)
  if (token) {
    console.log('');
    console.log('3️⃣ Testing menu endpoint...');
    try {
      const res = await makeRequest('GET', '/api/menu/my', null, token);
      console.log('   Status:', res.status);
      if (Array.isArray(res.data)) {
        console.log('   ✅ Got', res.data.length, 'menu items');
      } else {
        console.log('   Response:', res.data);
      }
    } catch (err) {
      console.log('   ❌ Failed:', err.message);
    }

    // Test 4: Get pending maids (admin only)
    console.log('');
    console.log('4️⃣ Testing pending maids endpoint...');
    try {
      const res = await makeRequest('GET', '/api/maids/pending', null, token);
      console.log('   Status:', res.status);
      if (Array.isArray(res.data)) {
        console.log('   ✅ Got', res.data.length, 'pending maids');
      } else {
        console.log('   Response:', res.data);
      }
    } catch (err) {
      console.log('   ❌ Failed:', err.message);
    }

    // Test 5: Get admin dashboard
    console.log('');
    console.log('5️⃣ Testing admin dashboard endpoint...');
    try {
      const res = await makeRequest('GET', '/api/admin/dashboard', null, token);
      console.log('   Status:', res.status);
      if (res.data.stats) {
        console.log('   ✅ Got dashboard stats:', res.data.stats);
      } else {
        console.log('   Response:', res.data);
      }
    } catch (err) {
      console.log('   ❌ Failed:', err.message);
    }

    // Test 6: Get admin payments
    console.log('');
    console.log('6️⃣ Testing admin payments endpoint...');
    try {
      const res = await makeRequest('GET', '/api/payments/admin', null, token);
      console.log('   Status:', res.status);
      if (res.data.payments) {
        console.log('   ✅ Got', res.data.payments.length, 'payments');
      } else {
        console.log('   Response:', res.data);
      }
    } catch (err) {
      console.log('   ❌ Failed:', err.message);
    }

    // Test 7: Get payment stats
    console.log('');
    console.log('7️⃣ Testing payment stats endpoint...');
    try {
      const res = await makeRequest('GET', '/api/payments/admin/stats', null, token);
      console.log('   Status:', res.status);
      if (res.data.totalPaid !== undefined) {
        console.log('   ✅ Got payment stats:', res.data);
      } else {
        console.log('   Response:', res.data);
      }
    } catch (err) {
      console.log('   ❌ Failed:', err.message);
    }

    // Test 8: Get conversations
    console.log('');
    console.log('8️⃣ Testing conversations endpoint...');
    try {
      const res = await makeRequest('GET', '/api/conversations', null, token);
      console.log('   Status:', res.status);
      if (Array.isArray(res.data)) {
        console.log('   ✅ Got', res.data.length, 'conversations');
      } else {
        console.log('   Response:', res.data);
      }
    } catch (err) {
      console.log('   ❌ Failed:', err.message);
    }
  }

  console.log('');
  console.log('🏁 API tests complete!');
}

testApis().catch(console.error);
