// simple-test-social-media.mjs - Simple test for social media API endpoint
console.log('🔍 Testing Social Media API endpoint...\n');

const baseUrl = 'http://localhost:3000';

async function testSocialMediaAPI() {
  try {
    console.log('📡 Testing GET /api/admin/social-media (without auth)');
    
    const response = await fetch(`${baseUrl}/api/admin/social-media`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ API Response structure:');
      console.log('- Success:', data.success);
      console.log('- SocialMedias array length:', data.socialMedias?.length || 0);
      console.log('- Members array length:', data.members?.length || 0);
      console.log('- Platforms:', data.platforms);
      console.log('- Total:', data.total);
      
      if (data.socialMedias && data.socialMedias.length > 0) {
        console.log('\n📄 First social media entry:');
        console.log(JSON.stringify(data.socialMedias[0], null, 2));
      } else {
        console.log('\n📄 No social media entries found');
      }
      
    } else {
      const errorText = await response.text();
      console.log('\n❌ API Error:');
      console.log('Status:', response.status);
      console.log('Response:', errorText);
      
      if (response.status === 401) {
        console.log('\nℹ️  This is expected - endpoint requires authentication');
      }
    }

  } catch (error) {
    console.error('\n💥 Request failed:', error.message);
  }
}

// Run the test
testSocialMediaAPI();
