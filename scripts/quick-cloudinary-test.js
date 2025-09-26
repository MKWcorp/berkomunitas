#!/usr/bin/env node

/**
 * Quick Cloudinary Test
 * Jalankan dengan: node scripts/quick-cloudinary-test.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Read .env file
let envVars = {};
try {
  const envPath = path.join(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/^"(.*)"$/, '$1');
      envVars[key.trim()] = value.trim();
    }
  });
} catch (error) {
  console.log('❌ Error reading .env file:', error.message);
  process.exit(1);
}

console.log('🧪 QUICK CLOUDINARY TEST');
console.log('=========================');
console.log(`📡 Cloud Name: ${envVars.CLOUDINARY_CLOUD_NAME}`);
console.log(`🔑 API Key: ${envVars.CLOUDINARY_API_KEY?.slice(0, 4)}***`);
console.log(`🔐 API Secret: ${envVars.CLOUDINARY_API_SECRET ? '***configured' : 'missing'}`);
console.log('');

async function quickTest() {
  try {
    console.log('🔄 Testing connection...');
    
    // Simple ping test dengan credentials
    const timestamp = Math.round(Date.now() / 1000);
    const stringToSign = `timestamp=${timestamp}${envVars.CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${envVars.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          api_key: envVars.CLOUDINARY_API_KEY,
          timestamp: timestamp.toString(),
          signature: signature
        })
      }
    );
    
    clearTimeout(timeoutId);
    
    console.log(`📊 Response status: ${response.status}`);
    
    if (response.status === 400) {
      const errorData = await response.json();
      if (errorData.error && errorData.error.message && errorData.error.message.includes('Empty file')) {
        console.log('✅ SUCCESS: Credentials are valid! (Empty file error is expected)');
        console.log('🎉 Cloudinary is ready for uploads');
        return true;
      } else {
        console.log('❌ Unexpected 400 error:', errorData.error?.message);
        return false;
      }
    } else if (response.status === 401) {
      console.log('❌ FAILED: Invalid credentials (401 Unauthorized)');
      return false;
    } else {
      const responseText = await response.text();
      console.log(`⚠️  Unexpected response: ${response.status} - ${responseText.slice(0, 200)}`);
      return false;
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('❌ TIMEOUT: Request took too long (10s limit)');
    } else {
      console.log('❌ ERROR:', error.message);
    }
    return false;
  }
}

async function runTest() {
  const isValid = await quickTest();
  
  console.log('\n' + '='.repeat(25));
  if (isValid) {
    console.log('✅ RESULT: Cloudinary configuration is working!');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Test upload pada website Anda');
    console.log('   2. Jika masih error, periksa browser console');
    console.log('   3. Pastikan file size < 5MB');
  } else {
    console.log('❌ RESULT: There are still issues with Cloudinary');
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Double-check API credentials');
    console.log('   2. Verify Cloudinary account is active');
    console.log('   3. Check upload preset exists');
  }
}

runTest();
