// Debug script untuk mengecek frontend logic privilege
console.log('🔍 Debugging Frontend Privilege Logic...\n');

// Import privilege checker
const { hasPrivilege } = require('./src/utils/privilegeChecker');

// Simulasi data yang kemungkinan diterima dari API
const testScenarios = [
  {
    name: 'Admin User - Real Case',
    memberData: {
      id: 239,
      privilege: 'admin',
      coin: 5950
    },
    reward: {
      id: 1,
      reward_name: 'Netflix Premium 1 Bulan',
      required_privilege: 'berkomunitasplus',
      point_cost: 2500,
      stock: 10,
      is_affordable: true
    }
  },
  {
    name: 'Admin User - High Cost Reward',
    memberData: {
      id: 239,
      privilege: 'admin', 
      coin: 3000
    },
    reward: {
      id: 2,
      reward_name: 'Expensive Reward',
      required_privilege: 'berkomunitasplus',
      point_cost: 5000,
      stock: 5,
      is_affordable: false
    }
  }
];

console.log('=== TESTING FRONTEND LOGIC ===\n');

testScenarios.forEach((scenario, index) => {
  console.log(`Test ${index + 1}: ${scenario.name}`);
  console.log(`User: ID ${scenario.memberData.id}, Privilege: ${scenario.memberData.privilege}, Coins: ${scenario.memberData.coin}`);
  console.log(`Reward: ${scenario.reward.reward_name} (${scenario.reward.required_privilege} required, ${scenario.reward.point_cost} coins)`);
  
  // Replicate frontend logic exactly
  const canAfford = scenario.reward.is_affordable;
  const inStock = scenario.reward.stock > 0;
  
  // Check if user has required privilege (hierarchical check)
  const hasRequiredPrivilege = !scenario.reward.required_privilege || 
    scenario.reward.required_privilege === 'user' || 
    hasPrivilege(scenario.memberData.privilege || 'user', scenario.reward.required_privilege);
  
  const isBerkomunitsPlus = scenario.reward.required_privilege === 'berkomunitasplus';
  const isPrivilegedReward = scenario.reward.required_privilege && scenario.reward.required_privilege !== 'user';
  const lacksRequiredPrivilege = isPrivilegedReward && !hasRequiredPrivilege;
  
  const canRedeem = canAfford && inStock && hasRequiredPrivilege;
  
  console.log(`  - Can Afford: ${canAfford ? '✅' : '❌'} (is_affordable: ${scenario.reward.is_affordable})`);
  console.log(`  - In Stock: ${inStock ? '✅' : '❌'} (stock: ${scenario.reward.stock})`);
  console.log(`  - Has Required Privilege: ${hasRequiredPrivilege ? '✅' : '❌'}`);
  console.log(`  - Is Privileged Reward: ${isPrivilegedReward ? '✅' : '❌'}`);
  console.log(`  - Lacks Required Privilege: ${lacksRequiredPrivilege ? '❌' : '✅'}`);
  console.log(`  - Final Can Redeem: ${canRedeem ? '🎉 YES' : '❌ NO'}`);
  
  // Check what would happen in handleRedeemClick
  console.log('\\n  handleRedeemClick logic:');
  if (scenario.reward.required_privilege && scenario.reward.required_privilege !== 'user') {
    const userHasRequiredPrivilege = hasPrivilege(scenario.memberData.privilege || 'user', scenario.reward.required_privilege);
    
    if (!userHasRequiredPrivilege) {
      console.log(`  - Would show error: "Hadiah ini memerlukan privilege ${scenario.reward.required_privilege}"`);
    } else {
      console.log(`  - Privilege check passed ✅`);
      
      if (scenario.memberData.coin < scenario.reward.point_cost) {
        console.log(`  - Would show error: "Coin tidak mencukupi"`);
      } else if (scenario.reward.stock <= 0) {
        console.log(`  - Would show error: "Stok hadiah sudah habis"`);
      } else {
        console.log(`  - All checks passed - would open redeem modal ✅`);
      }
    }
  }
  
  console.log('\\n' + '='.repeat(60) + '\\n');
});

console.log('🎯 If admin still cannot access berkomunitasplus rewards, the issue might be:');
console.log('1. API returns is_affordable: false for admin user');
console.log('2. API returns different privilege than expected');
console.log('3. Frontend state management issue');
console.log('4. Backend privilege checking logic different from frontend');