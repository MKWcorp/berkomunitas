#!/usr/bin/env node

/**
 * Simple test script to verify admin APIs without authentication
 * This can help identify if the issue is authentication or database-related
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'https://komunitas-komentar.vercel.app'; // Production URL

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Admin-API-Test/1.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: e.message
          });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy());
    req.end();
  });
}

async function testAPI() {
  console.log('🔍 Testing Admin APIs...\n');
  
  const endpoints = [
    '/api/members',
    '/api/admin/badges', 
    '/api/admin/member-badges',
    '/api/admin/points'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`📡 Testing: ${endpoint}`);
    try {
      const result = await makeRequest(endpoint);
      
      console.log(`   Status: ${result.status}`);
      
      if (result.status === 200) {
        console.log(`   ✅ Success`);
        if (typeof result.data === 'object') {
          if (Array.isArray(result.data)) {
            console.log(`   📊 Data: Array with ${result.data.length} items`);
          } else if (result.data.data) {
            console.log(`   📊 Data: Object with 'data' property`);
          } else {
            console.log(`   📊 Data: Object with keys: ${Object.keys(result.data).join(', ')}`);
          }
        }
      } else if (result.status === 401) {
        console.log(`   🔒 Unauthorized (expected for admin endpoints)`);
      } else if (result.status === 403) {
        console.log(`   🚫 Forbidden (expected for admin endpoints)`);
      } else {
        console.log(`   ❌ Error: ${result.status}`);
        if (result.data) {
          console.log(`   📄 Response: ${typeof result.data === 'string' ? result.data.substring(0, 200) : JSON.stringify(result.data).substring(0, 200)}`);
        }
      }
    } catch (error) {
      console.log(`   💥 Request failed: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('🏁 Test completed!');
}

testAPI().catch(console.error);
