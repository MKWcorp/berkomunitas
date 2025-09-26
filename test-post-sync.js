// Simple test untuk POST sync endpoint
const https = require('https');

const postData = JSON.stringify({});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/beauty-consultant/sync',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🔄 Testing POST /api/beauty-consultant/sync...');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Response Body:', responseData);
    try {
      const jsonResponse = JSON.parse(responseData);
      console.log('Parsed Response:', JSON.stringify(jsonResponse, null, 2));
    } catch (error) {
      console.log('Response is not valid JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(postData);
req.end();