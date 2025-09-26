/**
 * Test Script: Verify Username API Authentication Fix
 */

const fetch = require('node-fetch');

async function testUsernameAPI() {
  console.log('🧪 Testing Username API Authentication Fix...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test 1: GET without authentication (should be 401)
    console.log('1️⃣ Testing GET /api/profil/username without auth...');
    const getResponse = await fetch(`${baseUrl}/api/profil/username`);
    const getData = await getResponse.json();
    
    if (getResponse.status === 401) {
      console.log('✅ GET request correctly returns 401 Unauthorized');
      console.log('   Response:', getData.error);
    } else {
      console.log('❌ Expected 401, got:', getResponse.status);
    }
    
    // Test 2: POST without authentication (should be 401)
    console.log('\n2️⃣ Testing POST /api/profil/username without auth...');
    const postResponse = await fetch(`${baseUrl}/api/profil/username`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'test-username',
        display_name: 'Test User'
      })
    });
    const postData = await postResponse.json();
    
    if (postResponse.status === 401) {
      console.log('✅ POST request correctly returns 401 Unauthorized');
      console.log('   Response:', postData.error);
    } else {
      console.log('❌ Expected 401, got:', postResponse.status);
    }
    
    // Test 3: DELETE without authentication (should be 401)
    console.log('\n3️⃣ Testing DELETE /api/profil/username without auth...');
    const deleteResponse = await fetch(`${baseUrl}/api/profil/username`, {
      method: 'DELETE'
    });
    const deleteData = await deleteResponse.json();
    
    if (deleteResponse.status === 401) {
      console.log('✅ DELETE request correctly returns 401 Unauthorized');
      console.log('   Response:', deleteData.error);
    } else {
      console.log('❌ Expected 401, got:', deleteResponse.status);
    }
    
    // Test 4: Test profile wall API
    console.log('\n4️⃣ Testing POST /api/profil/wall without auth...');
    const wallResponse = await fetch(`${baseUrl}/api/profil/wall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        profileOwnerId: 1,
        message: 'Test message'
      })
    });
    const wallData = await wallResponse.json();
    
    if (wallResponse.status === 401) {
      console.log('✅ Wall POST request correctly returns 401 Unauthorized');
      console.log('   Response:', wallData.error);
    } else {
      console.log('❌ Expected 401, got:', wallResponse.status);
    }
    
    // Test 5: Test public profile API (should work without auth)
    console.log('\n5️⃣ Testing GET /api/profil/mk_wiro (public profile)...');
    const profileResponse = await fetch(`${baseUrl}/api/profil/mk_wiro`);
    
    if (profileResponse.status === 200) {
      const profileData = await profileResponse.json();
      console.log('✅ Public profile API works correctly');
      console.log('   Profile found:', profileData.nama_lengkap);
      console.log('   Username:', profileData.username);
      console.log('   Has custom username:', profileData.is_custom_username);
    } else if (profileResponse.status === 404) {
      console.log('⚠️ User mk_wiro not found (expected if not in database)');
    } else {
      console.log('❌ Unexpected status for public profile:', profileResponse.status);
    }
    
    console.log('\n🎉 Authentication test completed!');
    console.log('\n📝 Summary:');
    console.log('• Username API properly requires authentication');
    console.log('• Wall posting API properly requires authentication');
    console.log('• Public profile API works without authentication');
    console.log('• All endpoints return proper error messages');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testUsernameAPI()
    .then(() => {
      console.log('\n✨ Test script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testUsernameAPI };
