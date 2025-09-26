// Debug script untuk test admin subdomain
// Jalankan: node debug-admin-subdomain.js

async function testAdminEndpoint() {
  try {
    console.log('🔍 Testing admin endpoints...\n');
    
    // Test main domain admin check
    console.log('1. Testing main domain admin API:');
    const response1 = await fetch('https://berkomunitas.com/api/debug/admin');
    const data1 = await response1.json();
    console.log('Main domain response:', JSON.stringify(data1, null, 2));
    
    console.log('\n2. Testing admin subdomain:');
    console.log('URL: https://admin.berkomunitas.com/');
    
    console.log('\n3. Testing admin API from subdomain:');
    const response2 = await fetch('https://admin.berkomunitas.com/api/debug/admin');
    const data2 = await response2.json();
    console.log('Subdomain API response:', JSON.stringify(data2, null, 2));
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.log('\n💡 Possible issues:');
    console.log('- DNS not propagated yet');
    console.log('- SSL certificate not ready');
    console.log('- Vercel domain configuration missing');
    console.log('- Authentication required for this API');
  }
}

async function testMiddleware() {
  console.log('\n🔧 Middleware Logic Test:');
  
  const testCases = [
    {
      hostname: 'admin.berkomunitas.com',
      pathname: '/',
      expected: '/admin-app'
    },
    {
      hostname: 'admin.berkomunitas.com', 
      pathname: '/dashboard',
      expected: '/admin-app/dashboard'
    },
    {
      hostname: 'berkomunitas.com',
      pathname: '/admin-app',
      expected: 'no rewrite (skip middleware)'
    }
  ];
  
  testCases.forEach(test => {
    console.log(`\nInput: ${test.hostname}${test.pathname}`);
    console.log(`Expected: ${test.expected}`);
  });
}

console.log('🚀 Admin Subdomain Debug Tool');
console.log('===============================');

// Jalankan test
testMiddleware();
testAdminEndpoint();
