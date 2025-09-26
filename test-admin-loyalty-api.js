/**
 * Admin API Testing Script: Manual Loyalty Addition
 * Test apakah penambahan loyalty via admin API akan otomatis menambah coin
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000'; // Sesuaikan dengan port development Anda

async function testAdminLoyaltyAddition() {
  console.log('🧪 Testing Admin Manual Loyalty Addition API...\n');

  try {
    // 1. Get current user data first
    console.log('📊 Step 1: Getting user data...');
    
    // Ambil data user untuk testing (sesuaikan user_id)
    const userId = 'test-user-id'; // Ganti dengan user_id yang valid
    
    const userResponse = await axios.get(`${BASE_URL}/api/admin/members?userId=${userId}`);
    const userData = userResponse.data;
    
    console.log('Current user data:', userData);
    
    if (!userData || !userData.user_id) {
      console.log('❌ Please update the userId in the script with a valid user ID');
      return;
    }

    const initialLoyalty = userData.loyalty_point || 0;
    const initialCoin = userData.coin || 0;
    const testAmount = 1000;

    console.log(`   Initial Loyalty: ${initialLoyalty}`);
    console.log(`   Initial Coin: ${initialCoin}\n`);

    // 2. Test manual loyalty addition via admin API
    console.log('📊 Step 2: Adding loyalty via admin API...');
    
    const addLoyaltyRequest = {
      userId: userData.user_id,
      points: testAmount,
      reason: 'Testing loyalty-coin sync',
      type: 'loyalty'
    };

    console.log('Sending request:', addLoyaltyRequest);
    
    const addResponse = await axios.post(`${BASE_URL}/api/admin/points/manual`, addLoyaltyRequest);
    
    console.log('API Response:', addResponse.data);

    // 3. Check updated user data
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for potential triggers

    console.log('📊 Step 3: Checking updated user data...');
    
    const updatedUserResponse = await axios.get(`${BASE_URL}/api/admin/members?userId=${userId}`);
    const updatedUserData = updatedUserResponse.data;

    const newLoyalty = updatedUserData.loyalty_point || 0;
    const newCoin = updatedUserData.coin || 0;

    console.log('Updated user data:');
    console.log(`   New Loyalty: ${newLoyalty} (Expected: ${initialLoyalty + testAmount})`);
    console.log(`   New Coin: ${newCoin} (Expected: ${initialCoin + testAmount} if sync works)`);

    // 4. Analysis
    const loyaltyUpdated = newLoyalty === (initialLoyalty + testAmount);
    const coinSynced = newCoin === (initialCoin + testAmount);

    console.log('\n📋 ANALYSIS:');
    console.log('=============');
    console.log(`✅ Loyalty Updated Correctly: ${loyaltyUpdated ? 'YES' : 'NO'}`);
    console.log(`✅ Coin Auto-Synced: ${coinSynced ? 'YES' : 'NO'}`);

    if (!coinSynced) {
      console.log('\n🔴 ISSUE DETECTED:');
      console.log('   Coin did NOT automatically sync with loyalty addition');
      console.log('   This confirms that database triggers/functions are missing or broken');
      console.log('   Recommendation: Update admin workflow to manually add coin when adding loyalty');
    } else {
      console.log('\n🟢 SUCCESS:');
      console.log('   Coin automatically synced with loyalty addition');
      console.log('   Database triggers/functions are working correctly');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Utility function to test with multiple scenarios
async function runComprehensiveAPITest() {
  console.log('🚀 Running Comprehensive Admin API Test\n');
  
  const testCases = [
    { amount: 500, description: 'Small loyalty addition' },
    { amount: 1000, description: 'Medium loyalty addition' },
    { amount: 2500, description: 'Large loyalty addition' }
  ];

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🧪 Testing: ${testCase.description} (+${testCase.amount})`);
    console.log('='.repeat(50));
    
    // You would implement specific test logic here
    // This is a template for multiple test scenarios
  }
}

if (require.main === module) {
  console.log('🚀 Admin API Loyalty-Coin Sync Test\n');
  console.log('⚠️  Please update the userId variable in the script before running\n');
  
  testAdminLoyaltyAddition();
}

module.exports = { testAdminLoyaltyAddition };