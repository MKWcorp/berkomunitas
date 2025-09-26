// Test script untuk fitur deteksi duplikasi data profil
// node scripts/test-duplicate-detection.js

const testDuplicateDetection = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Duplicate Detection Feature...\n');

  // Test 1: Check WhatsApp duplicate
  console.log('📱 Test 1: WhatsApp Duplicate Detection');
  try {
    const response = await fetch(`${baseUrl}/api/profil/check-duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add mock auth headers if needed
      },
      body: JSON.stringify({
        nomer_wa: '+6281234567890',
        social_media_links: []
      })
    });

    const result = await response.json();
    console.log('✅ WhatsApp check result:', result);
  } catch (error) {
    console.log('❌ WhatsApp check error:', error.message);
  }

  console.log('\n📱 Test 2: Social Media Duplicate Detection');
  try {
    const response = await fetch(`${baseUrl}/api/profil/check-duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nomer_wa: '',
        social_media_links: [
          'https://instagram.com/testuser123',
          'https://tiktok.com/@testuser456'
        ]
      })
    });

    const result = await response.json();
    console.log('✅ Social media check result:', result);
  } catch (error) {
    console.log('❌ Social media check error:', error.message);
  }

  console.log('\n🔗 Test 3: Account Merge Simulation');
  try {
    const response = await fetch(`${baseUrl}/api/profil/merge-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target_clerk_id: 'user_test_target_id',
        action: 'link_email'
      })
    });

    const result = await response.json();
    console.log('✅ Account merge result:', result);
  } catch (error) {
    console.log('❌ Account merge error:', error.message);
  }

  console.log('\n✨ Duplicate Detection Test Complete!');
};

// Test data examples
const exampleDuplicateScenarios = {
  whatsapp_duplicate: {
    scenario: 'User A sudah punya nomor WA +6281234567890, User B coba daftar dengan nomor sama',
    expected_behavior: 'Dialog muncul dengan opsi: Link email ke akun User A, atau merge akun'
  },
  instagram_duplicate: {
    scenario: 'User A sudah punya @instagram_user, User B coba daftar dengan link Instagram sama',
    expected_behavior: 'Dialog muncul dengan informasi akun yang sudah ada (email disamarkan)'
  },
  multiple_duplicates: {
    scenario: 'User B coba daftar dengan WA dan Instagram yang sudah dipakai User A',
    expected_behavior: 'Dialog muncul dengan semua duplikasi yang ditemukan'
  }
};

console.log('📋 Example Duplicate Scenarios:');
Object.entries(exampleDuplicateScenarios).forEach(([key, value]) => {
  console.log(`\n🔹 ${key}:`);
  console.log(`   Scenario: ${value.scenario}`);
  console.log(`   Expected: ${value.expected_behavior}`);
});

console.log('\n🚀 To test manually:');
console.log('1. Start the development server: npm run dev');
console.log('2. Go to /profil page');
console.log('3. Try entering WhatsApp number or social media that already exists');
console.log('4. Check if duplicate detection dialog appears');

// Run the test if called directly
if (require.main === module) {
  testDuplicateDetection().catch(console.error);
}

module.exports = { testDuplicateDetection, exampleDuplicateScenarios };
