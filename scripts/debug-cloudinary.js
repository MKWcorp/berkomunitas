// Debug script untuk cek Cloudinary configuration
const checkCloudinaryConfig = () => {
  console.log('🔍 Checking Cloudinary Configuration...\n');
  
  const requiredVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY', 
    'CLOUDINARY_API_SECRET'
  ];
  
  const optionalVars = [
    'CLOUDINARY_UPLOAD_PRESET'
  ];
  
  console.log('✅ Required Environment Variables:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`   ${varName}: ${value.substring(0, 10)}... ✅`);
    } else {
      console.log(`   ${varName}: ❌ MISSING`);
    }
  });
  
  console.log('\n📋 Optional Environment Variables:');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`   ${varName}: ${value} ✅`);
    } else {
      console.log(`   ${varName}: Not set (will use default)`);
    }
  });
  
  console.log('\n🧪 Testing Cloudinary API...');
  
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    const testUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
    console.log(`   API Endpoint: ${testUrl}`);
    
    // Test if cloud name is accessible
    fetch(`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/sample.jpg`)
      .then(response => {
        if (response.ok) {
          console.log('   Cloud Name: ✅ Valid');
        } else {
          console.log('   Cloud Name: ❌ Invalid or not accessible');
        }
      })
      .catch(error => {
        console.log('   Cloud Name: ❌ Error checking:', error.message);
      });
  }
};

// Test upload function
const testCloudinaryUpload = async () => {
  console.log('\n🧪 Testing Simple Upload...');
  
  try {
    // Create a simple test image (1x1 pixel PNG)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const uploadData = {
      file: testImageBase64,
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default'
    };
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData)
      }
    );
    
    if (response.ok) {
      const result = await response.json();
      console.log('   Upload Test: ✅ SUCCESS');
      console.log('   Generated URL:', result.secure_url);
    } else {
      const errorData = await response.json();
      console.log('   Upload Test: ❌ FAILED');
      console.log('   Error:', errorData);
    }
    
  } catch (error) {
    console.log('   Upload Test: ❌ ERROR');
    console.log('   Error:', error.message);
  }
};

if (typeof window === 'undefined') {
  // Node.js environment
  checkCloudinaryConfig();
  
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    testCloudinaryUpload();
  }
}

module.exports = { checkCloudinaryConfig, testCloudinaryUpload };
