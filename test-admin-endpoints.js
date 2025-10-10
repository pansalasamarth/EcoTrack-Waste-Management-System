// Simple test script to verify admin endpoints
const BASE_URL = 'http://localhost:8800';

// Test data
const testAdminToken = 'your-admin-token-here'; // Replace with actual admin token

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testAdminToken}`
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    console.log(`${method} ${endpoint}: ${response.status}`);
    if (response.ok) {
      console.log('✅ Success:', data.msg || 'OK');
    } else {
      console.log('❌ Error:', data.msg || data.error || 'Unknown error');
    }
    return { success: response.ok, data };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint}: Network error -`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing Admin Dashboard Endpoints\n');

  // Test dashboard stats
  console.log('📊 Testing Dashboard Stats...');
  await testEndpoint('/api/admin/dashboard/stats');

  // Test analytics
  console.log('\n📈 Testing Analytics...');
  await testEndpoint('/api/admin/dashboard/analytics?period=7d');

  // Test user management
  console.log('\n👥 Testing User Management...');
  await testEndpoint('/api/admin/users?limit=5');
  await testEndpoint('/api/admin/users?search=test&role=user');

  // Test report management
  console.log('\n📋 Testing Report Management...');
  await testEndpoint('/api/admin/reports?limit=5');
  await testEndpoint('/api/admin/reports?status=full&admin_status=pending');

  // Test bin management
  console.log('\n🗑️ Testing Bin Management...');
  await testEndpoint('/api/admin/bins?limit=5');
  await testEndpoint('/api/admin/bins?status=filled&ward=Ward1');

  // Test settings
  console.log('\n⚙️ Testing Settings...');
  await testEndpoint('/api/admin/settings');
  
  // Test settings update
  const testSettings = {
    notifications: {
      emailAlerts: true,
      criticalAlerts: true
    },
    thresholds: {
      criticalCapacity: 90
    }
  };
  await testEndpoint('/api/admin/settings', 'PUT', testSettings);

  console.log('\n✅ All tests completed!');
  console.log('\nNote: Some tests may fail if:');
  console.log('- Server is not running on port 8800');
  console.log('- No admin token is provided');
  console.log('- Database is not connected');
  console.log('- No data exists in the database');
}

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  runTests();
} else {
  // Browser environment
  console.log('Run this script in Node.js or use the browser console');
  console.log('Make sure to replace testAdminToken with a real admin token');
}

