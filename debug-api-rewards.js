// Debug script untuk mengecek API rewards langsung
const fetch = require('node-fetch');

async function debugRewardsAPI() {
  console.log('🔍 Debugging Rewards API Access...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/rewards/redeem', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const result = await response.json();
    
    console.log('=== API RESPONSE STATUS ===');
    console.log(`HTTP Status: ${response.status}`);
    console.log(`Success: ${result.success}`);
    
    if (!result.success) {
      console.log(`Error: ${result.error}`);
      return;
    }
    
    const memberData = result.data.member;
    const rewards = result.data.rewards;
    
    console.log('\n=== MEMBER DATA ===');
    console.log(JSON.stringify(memberData, null, 2));
    
    console.log('\n=== REWARDS WITH REQUIRED_PRIVILEGE ===');
    const privilegedRewards = rewards.filter(r => r.required_privilege);
    privilegedRewards.forEach((reward, index) => {
      console.log(`${index + 1}. ${reward.reward_name}`);
      console.log(`   ID: ${reward.id}`);
      console.log(`   Required Privilege: ${reward.required_privilege}`);
      console.log(`   Point Cost: ${reward.point_cost}`);
      console.log(`   Stock: ${reward.stock}`);
      console.log(`   Is Affordable: ${reward.is_affordable}`);
      console.log('');
    });
    
    // Test privilege logic
    const { hasPrivilege } = require('./src/utils/privilegeChecker');
    
    console.log('=== PRIVILEGE LOGIC TEST ===');
    const userPrivilege = memberData?.privilege || 'user';
    console.log(`User Privilege: ${userPrivilege}`);
    
    const berkomunitsRewards = rewards.filter(r => r.required_privilege === 'berkomunitasplus');
    console.log(`\nBerkomunitasplus Rewards Found: ${berkomunitsRewards.length}`);
    
    berkomunitsRewards.forEach((reward, index) => {
      const hasRequiredPrivilege = hasPrivilege(userPrivilege, 'berkomunitasplus');
      const canAfford = reward.is_affordable;
      const inStock = reward.stock > 0;
      const canRedeem = hasRequiredPrivilege && canAfford && inStock;
      
      console.log(`\n${index + 1}. ${reward.reward_name}`);
      console.log(`   Has Required Privilege: ${hasRequiredPrivilege ? '✅' : '❌'}`);
      console.log(`   Can Afford: ${canAfford ? '✅' : '❌'}`);
      console.log(`   In Stock: ${inStock ? '✅' : '❌'}`);
      console.log(`   Can Redeem: ${canRedeem ? '🎉 YES' : '❌ NO'}`);
      
      if (!canRedeem) {
        console.log('   Reason: ');
        if (!hasRequiredPrivilege) console.log('   - Lacks required privilege');
        if (!canAfford) console.log('   - Cannot afford');
        if (!inStock) console.log('   - Out of stock');
      }
    });
    
  } catch (error) {
    console.error('Error fetching rewards:', error.message);
  }
}

debugRewardsAPI();