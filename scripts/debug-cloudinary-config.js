#!/usr/bin/env node

/**
 * Debug script untuk memverifikasi konfigurasi Cloudinary
 * Jalankan dengan: node scripts/debug-cloudinary-config.js
 */

require('dotenv').config();

console.log('🔍 DEBUG CLOUDINARY CONFIGURATION');
console.log('=====================================');

// Check environment variables
const requiredVars = {
  'CLOUDINARY_CLOUD_NAME': process.env.CLOUDINARY_CLOUD_NAME,
  'CLOUDINARY_API_KEY': process.env.CLOUDINARY_API_KEY,
  'CLOUDINARY_API_SECRET': process.env.CLOUDINARY_API_SECRET,
  'CLOUDINARY_UPLOAD_PRESET': process.env.CLOUDINARY_UPLOAD_PRESET
};

console.log('\n📋 Environment Variables Status:');
Object.entries(requiredVars).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const displayValue = value 
    ? (key.includes('SECRET') || key.includes('KEY') ? '***' + value.slice(-4) : value)
    : 'NOT SET';
  console.log(`${status} ${key}: ${displayValue}`);
});

// Validate configuration
const isConfigValid = requiredVars.CLOUDINARY_CLOUD_NAME && 
                     requiredVars.CLOUDINARY_API_KEY && 
                     requiredVars.CLOUDINARY_API_SECRET;

console.log('\n🔧 Configuration Analysis:');
if (!isConfigValid) {
  console.log('❌ INVALID: Missing required Cloudinary credentials');
  
  if (!requiredVars.CLOUDINARY_CLOUD_NAME) {
    console.log('   • CLOUDINARY_CLOUD_NAME is required');
  }
  if (!requiredVars.CLOUDINARY_API_KEY || requiredVars.CLOUDINARY_API_KEY === 'your-api-key') {
    console.log('   • CLOUDINARY_API_KEY contains placeholder value or is missing');
  }
  if (!requiredVars.CLOUDINARY_API_SECRET || requiredVars.CLOUDINARY_API_SECRET === 'your-api-secret') {
    console.log('   • CLOUDINARY_API_SECRET contains placeholder value or is missing');
  }
  
  console.log('\n💡 SOLUTION:');
  console.log('1. Login to your Cloudinary Dashboard: https://cloudinary.com/console');
  console.log('2. Go to Settings > API Keys');
  console.log('3. Copy your API Key and API Secret');
  console.log('4. Update .env file with correct values:');
  console.log('   CLOUDINARY_API_KEY=your_actual_api_key');
  console.log('   CLOUDINARY_API_SECRET=your_actual_api_secret');
  
} else {
  console.log('✅ VALID: All required credentials are set');
  
  // Test basic API connectivity
  testCloudinaryConnection();
}

async function testCloudinaryConnection() {
  console.log('\n🌐 Testing Cloudinary API Connection...');
  
  try {
    const crypto = require('crypto');
    const timestamp = Math.round(Date.now() / 1000);
    
    // Create signature for ping test
    const stringToSign = `timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          api_key: process.env.CLOUDINARY_API_KEY,
          timestamp: timestamp.toString(),
          signature: signature
        })
      }
    );
    
    if (response.status === 400) {
      // Expected for empty upload, but credentials are valid
      console.log('✅ API Connection: Credentials are valid');
    } else if (response.status === 401) {
      console.log('❌ API Connection: Invalid credentials');
    } else {
      console.log(`⚠️  API Connection: Unexpected response ${response.status}`);
    }
    
  } catch (error) {
    console.log('❌ API Connection failed:', error.message);
  }
}

// Upload preset check
console.log('\n🎯 Upload Preset Analysis:');
if (requiredVars.CLOUDINARY_UPLOAD_PRESET) {
  console.log(`✅ Upload preset configured: ${requiredVars.CLOUDINARY_UPLOAD_PRESET}`);
  console.log('   Note: Unsigned uploads will use this preset');
} else {
  console.log('⚠️  No upload preset configured');
  console.log('   Note: Will attempt signed uploads only');
}

console.log('\n📝 Recommendations:');
console.log('1. For production: Use signed uploads (API Key + Secret)');
console.log('2. For development: Either signed or unsigned uploads work');
console.log('3. Create upload preset for unsigned uploads if needed');
console.log('4. Test upload after fixing credentials');

console.log('\n=====================================');
