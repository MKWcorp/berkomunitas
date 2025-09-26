#!/usr/bin/env node

/**
 * Debug script untuk memverifikasi konfigurasi Cloudinary
 * Jalankan dengan: node scripts/debug-cloudinary-simple.js
 */

// Baca file .env secara manual
const fs = require('fs');
const path = require('path');

console.log('🔍 DEBUG CLOUDINARY CONFIGURATION');
console.log('=====================================');

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

// Check environment variables
const requiredVars = {
  'CLOUDINARY_CLOUD_NAME': envVars.CLOUDINARY_CLOUD_NAME,
  'CLOUDINARY_API_KEY': envVars.CLOUDINARY_API_KEY,
  'CLOUDINARY_API_SECRET': envVars.CLOUDINARY_API_SECRET,
  'CLOUDINARY_UPLOAD_PRESET': envVars.CLOUDINARY_UPLOAD_PRESET
};

console.log('\n📋 Environment Variables Status:');
Object.entries(requiredVars).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  let displayValue = 'NOT SET';
  
  if (value) {
    if (key.includes('SECRET') || key.includes('KEY')) {
      displayValue = '***' + value.slice(-4);
    } else {
      displayValue = value;
    }
    
    // Check for placeholder values
    if (value === 'your-api-key' || value === 'your-api-secret') {
      displayValue += ' (PLACEHOLDER - NEEDS UPDATE!)';
    }
  }
  
  console.log(`${status} ${key}: ${displayValue}`);
});

// Validate configuration
const isConfigValid = requiredVars.CLOUDINARY_CLOUD_NAME && 
                     requiredVars.CLOUDINARY_API_KEY && 
                     requiredVars.CLOUDINARY_API_SECRET &&
                     requiredVars.CLOUDINARY_API_KEY !== 'your-api-key' &&
                     requiredVars.CLOUDINARY_API_SECRET !== 'your-api-secret';

console.log('\n🔧 Configuration Analysis:');
if (!isConfigValid) {
  console.log('❌ INVALID: Missing or placeholder Cloudinary credentials detected');
  
  const issues = [];
  if (!requiredVars.CLOUDINARY_CLOUD_NAME) {
    issues.push('CLOUDINARY_CLOUD_NAME is required');
  }
  if (!requiredVars.CLOUDINARY_API_KEY || requiredVars.CLOUDINARY_API_KEY === 'your-api-key') {
    issues.push('CLOUDINARY_API_KEY contains placeholder value or is missing');
  }
  if (!requiredVars.CLOUDINARY_API_SECRET || requiredVars.CLOUDINARY_API_SECRET === 'your-api-secret') {
    issues.push('CLOUDINARY_API_SECRET contains placeholder value or is missing');
  }
  
  issues.forEach(issue => console.log(`   • ${issue}`));
  
  console.log('\n💡 SOLUTION STEPS:');
  console.log('1. 🌐 Login to Cloudinary Dashboard: https://cloudinary.com/console');
  console.log('2. ⚙️  Go to Settings > API Keys (or Dashboard > API Environment variable)');
  console.log('3. 📋 Copy your API Key and API Secret');
  console.log('4. ✏️  Update .env file with correct values:');
  console.log('   CLOUDINARY_API_KEY=your_actual_api_key_here');
  console.log('   CLOUDINARY_API_SECRET=your_actual_api_secret_here');
  console.log('5. 🔄 Restart your development server');
  
} else {
  console.log('✅ VALID: All required credentials are properly configured');
  console.log('   Ready for production uploads!');
}

// Upload preset analysis
console.log('\n🎯 Upload Preset Analysis:');
if (requiredVars.CLOUDINARY_UPLOAD_PRESET) {
  console.log(`✅ Upload preset configured: ${requiredVars.CLOUDINARY_UPLOAD_PRESET}`);
  console.log('   Note: Unsigned uploads will use this preset as fallback');
} else {
  console.log('⚠️  No upload preset configured');
  console.log('   Note: Will use signed uploads only (recommended for production)');
}

console.log('\n📈 Current Upload Strategy:');
console.log('1. 🥇 VPS Upload (if VPS_UPLOAD_URL configured)');
console.log('2. 🥈 Cloudinary Signed Upload (using API Key + Secret)');
console.log('3. 🥉 Cloudinary Unsigned Upload (using upload preset)');
console.log('4. 🏠 Local Storage (development only, not available on Vercel)');

console.log('\n📝 Next Steps:');
if (!isConfigValid) {
  console.log('❗ URGENT: Fix Cloudinary credentials to resolve upload errors');
  console.log('📧 If you need help getting credentials, contact your Cloudinary admin');
} else {
  console.log('✅ Configuration looks good! Test upload functionality');
  console.log('🧪 Run upload test: Try uploading a profile picture');
}

console.log('\n=====================================');
