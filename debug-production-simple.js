// Script untuk debug production API
const https = require('https');

async function testAPI(path, description) {
  return new Promise((resolve) => {
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
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.log('Error - Status:', res.statusCode);
          if (data.includes('404')) {
            console.log('404 Error - Route not found');
          } else {
            console.log('Error response preview:', data.substring(0, 200) + '...');
          }
        } else {
          try {
            const jsonData = JSON.parse(data);
            console.log('SUCCESS! API working');
            console.log('Response keys:', Object.keys(jsonData));
          } catch (parseError) {
            console.log('SUCCESS! Non-JSON response (first 200 chars):', data.substring(0, 200));
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
}

main();
