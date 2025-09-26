// Script untuk debug production API
// Jalankan dengan: node debug-production-api.js

const https = require('https');

async function testAPI(path, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== Testing ${description} ===`);
    console.log(`Path: ${path}`);
    
    const options = {
      hostname: 'berkomunitas.com',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Debug-Script/1.0'
      }
    };
    
    const req = https.request(options, (res) => {
      console.log('Response status:', res.statusCode);
      console.log('Response headers:', JSON.stringify(res.headers, null, 2));
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.log('Error response body preview:', data.substring(0, 500) + '...');
        } else {
          try {
            const jsonData = JSON.parse(data);
            console.log('Success! Data received:', JSON.stringify(jsonData, null, 2));
          } catch (parseError) {
            console.log('Response body (not JSON, first 500 chars):', data.substring(0, 500));
          }
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('Network error:', error.message);
      resolve();
    });
    
    req.end();
  });
}

async function main() {
  // Test berbagai endpoint
  await testAPI('/api/dashboard', 'Dashboard API');
  await testAPI('/api/leaderboard', 'Leaderboard API (Target)');
  await testAPI('/api/tugas', 'Tugas API');
  await testAPI('/api/admin/dashboard', 'Admin Dashboard API');
}

main();

testProductionAPI();
