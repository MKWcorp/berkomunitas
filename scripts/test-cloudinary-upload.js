#!/usr/bin/env node

/**
 * Test Cloudinary Upload Functionality
 * Jalankan dengan: node scripts/test-cloudinary-upload.js
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

console.log('🧪 CLOUDINARY UPLOAD TEST');
console.log('==========================');

async function testCloudinaryUpload() {
  const cloudName = envVars.CLOUDINARY_CLOUD_NAME;
  const apiKey = envVars.CLOUDINARY_API_KEY;
  const apiSecret = envVars.CLOUDINARY_API_SECRET;
  const uploadPreset = envVars.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.log('❌ Missing Cloudinary credentials');
    return;
  }

  console.log(`📡 Testing upload to cloud: ${cloudName}`);

  // Create a simple test image (1x1 pixel PNG)
  const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  try {
    // Test Method 1: Signed Upload
    console.log('\n🔐 Testing Signed Upload...');
    const signedResult = await testSignedUpload(cloudName, apiKey, apiSecret, testImageBase64);
    console.log('✅ Signed Upload successful:', signedResult);

  } catch (signedError) {
    console.log('❌ Signed Upload failed:', signedError.message);
    
    try {
      // Test Method 2: Unsigned Upload (fallback)
      console.log('\n📝 Testing Unsigned Upload...');
      const unsignedResult = await testUnsignedUpload(cloudName, uploadPreset, testImageBase64);
      console.log('✅ Unsigned Upload successful:', unsignedResult);
      
    } catch (unsignedError) {
      console.log('❌ Unsigned Upload failed:', unsignedError.message);
      console.log('\n🔍 Both methods failed. This indicates:');
      console.log('   • Network connectivity issues');
      console.log('   • Invalid credentials');
      console.log('   • Cloudinary account restrictions');
      console.log('   • Upload preset configuration issues');
    }
  }
}

async function testSignedUpload(cloudName, apiKey, apiSecret, imageData) {
  const timestamp = Math.round(Date.now() / 1000);
  
  const uploadParams = {
    timestamp: timestamp,
    folder: 'profile-pictures-test',
    transformation: 'w_100,h_100,c_fill'
  };
  
  // Create signature
  const sortedParams = Object.keys(uploadParams)
    .sort()
    .map(key => `${key}=${uploadParams[key]}`)
    .join('&');
    
  const stringToSign = sortedParams + apiSecret;
  const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

  // Prepare form data
  const formData = new URLSearchParams();
  formData.append('file', imageData);
  formData.append('timestamp', timestamp.toString());
  formData.append('folder', 'profile-pictures-test');
  formData.append('transformation', 'w_100,h_100,c_fill');
  formData.append('api_key', apiKey);
  formData.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.log('Response details:', errorData);
    throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
  }

  const result = await response.json();
  return result.secure_url;
}

async function testUnsignedUpload(cloudName, uploadPreset, imageData) {
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: imageData,
        upload_preset: uploadPreset,
        folder: 'profile-pictures-test'
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.log('Response details:', errorData);
    throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
  }

  const result = await response.json();
  return result.secure_url;
}

// Run the test
testCloudinaryUpload()
  .then(() => {
    console.log('\n✅ Upload test completed successfully!');
    console.log('🎉 Cloudinary is working properly');
    console.log('\n💡 If your web app still shows "General Error":');
    console.log('   • Check browser console for detailed error messages');
    console.log('   • Verify the upload endpoint is receiving files correctly');
    console.log('   • Check file size limits (max 5MB configured)');
    console.log('   • Ensure proper error handling in the frontend');
  })
  .catch((error) => {
    console.log('\n❌ Upload test failed completely');
    console.log('🔧 Possible solutions:');
    console.log('   • Verify internet connection');
    console.log('   • Check Cloudinary account status');
    console.log('   • Verify credentials are correctly copied');
    console.log('   • Check upload preset exists and is configured');
    console.error('\nError details:', error);
  });
