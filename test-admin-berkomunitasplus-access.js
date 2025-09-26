// Debug script untuk mengecek akses reward berkomunitasplus oleh admin
const { hasPrivilege } = require('./src/utils/privilegeChecker');

console.log('🔍 Testing BerkomunitsPlus Rewards Access by Admin...\n');

// Simulasi user admin
const adminUser = {
  id: 239,
  privilege: 'admin',
  coin: 5950
};

// Simulasi reward dengan required_privilege = 'berkomunitasplus'
const berkomunitsRewards = [
  {
    id: 1,
    reward_name: 'Netflix Premium 1 Bulan',
    required_privilege: 'berkomunitasplus',
    point_cost: 2500,
    stock: 10
  },
  {
    id: 2,
    reward_name: 'Spotify Premium 3 Bulan',
    required_privilege: 'berkomunitasplus',
    point_cost: 3000,
    stock: 5
  },
  {
    id: 3,
    reward_name: 'Adobe Creative Cloud 1 Bulan',
    required_privilege: 'berkomunitasplus',
    point_cost: 4000,
    stock: 3
  }
];

console.log('=== ADMIN USER DATA ===');
console.log(`User ID: ${adminUser.id}`);
console.log(`Privilege: ${adminUser.privilege}`);
console.log(`Coins: ${adminUser.coin}`);

console.log('\n=== BERKOMUNITASPLUS REWARDS ACCESS TEST ===');

berkomunitsRewards.forEach((reward, index) => {
  // Check if user has required privilege (hierarchical check)
  const hasRequiredPrivilege = !reward.required_privilege || 
    reward.required_privilege === 'user' || 
    hasPrivilege(adminUser.privilege, reward.required_privilege);
  
  const canAfford = adminUser.coin >= reward.point_cost;
  const inStock = reward.stock > 0;
  const canRedeem = hasRequiredPrivilege && canAfford && inStock;
  
  console.log(`\\n${index + 1}. ${reward.reward_name}`);
  console.log(`   Required Privilege: ${reward.required_privilege}`);
  console.log(`   Cost: ${reward.point_cost} coins`);
  console.log(`   Stock: ${reward.stock}`);
  console.log(`   Has Required Privilege: ${hasRequiredPrivilege ? '✅ YES' : '❌ NO'}`);
  console.log(`   Can Afford: ${canAfford ? '✅ YES' : '❌ NO'}`);
  console.log(`   In Stock: ${inStock ? '✅ YES' : '❌ NO'}`);
  console.log(`   Can Redeem: ${canRedeem ? '🎉 YES' : '❌ NO'}`);
});

console.log('\\n=== PRIVILEGE HIERARCHY TEST ===');
const privileges = ['user', 'berkomunitasplus', 'partner', 'admin'];
privileges.forEach(requiredPrivilege => {
  const hasAccess = hasPrivilege(adminUser.privilege, requiredPrivilege);
  console.log(`Admin can access ${requiredPrivilege} rewards: ${hasAccess ? '✅ YES' : '❌ NO'}`);
});

console.log('\\n🎯 CONCLUSION:');
console.log('Admin user should be able to access ALL berkomunitasplus rewards');
console.log('because admin privilege is higher than berkomunitasplus privilege');
console.log('in the hierarchy: user < berkomunitasplus < partner < admin');