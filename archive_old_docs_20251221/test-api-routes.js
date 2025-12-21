/**
 * Test script to verify the updated API routes
 * Run with: node test-api-routes.js
 */

const testRoutes = [
  '/api/profil/check-completeness',
  '/api/notifikasi?limit=10',
  '/api/profil/dashboard',
  '/api/profil/loyalty',
  '/api/profil'
];

console.log('🧪 Testing API Routes (without auth - expecting 401)...\n');

async function testRoute(route) {
  try {
    const url = `http://localhost:3000${route}`;
    console.log(`Testing: ${route}`);
    
    const response = await fetch(url);
    const status = response.status;
    
    if (status === 401) {
      console.log(`✅ ${route} - Working (401 Unauthorized as expected)`);
      return true;
    } else if (status === 500) {
      console.log(`❌ ${route} - Still returning 500 error`);
      const text = await response.text();
      console.log(`   Error: ${text.substring(0, 100)}...`);
      return false;
    } else {
      console.log(`⚠️  ${route} - Unexpected status: ${status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${route} - Connection error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  let passed = 0;
  let failed = 0;
  
  for (const route of testRoutes) {
    const result = await testRoute(route);
    if (result) passed++;
    else failed++;
    console.log('');
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${testRoutes.length}`);
  console.log(`❌ Failed: ${failed}/${testRoutes.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All API routes are responding correctly!');
    console.log('Next step: Test with a valid JWT token to verify full functionality.');
  } else {
    console.log('\n⚠️  Some routes still need fixing.');
  }
}

runTests().catch(console.error);
