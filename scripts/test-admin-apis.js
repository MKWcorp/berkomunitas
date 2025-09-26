// Test script for admin APIs
const fetch = require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testAPI(endpoint, description) {
  console.log(`\n=== Testing ${description} ===`);
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error(`❌ ${description} failed`);
    } else {
      console.log(`✅ ${description} success`);
    }
  } catch (error) {
    console.error(`❌ ${description} error:`, error.message);
  }
}

async function runTests() {
  console.log('Testing Admin APIs...');
  
  // Test basic APIs (these should work without auth in local dev)
  await testAPI('/api/members', 'Members API');
  await testAPI('/api/admin/badges', 'Admin Badges API');
  await testAPI('/api/admin/member-badges', 'Admin Member-Badges API');
  await testAPI('/api/admin/points', 'Admin Points API');
  
  console.log('\n=== Test completed ===');
}

runTests().catch(console.error);
