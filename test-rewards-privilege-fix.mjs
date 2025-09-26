import { hasPrivilege } from './src/utils/privilegeChecker.js';

console.log('🧪 Testing Rewards Privilege Logic Fix\n');

// Test different privilege scenarios
const testScenarios = [
  { privilege: 'user', label: 'Regular User' },
  { privilege: 'berkomunitasplus', label: 'BerkomunitsPlus User' },
  { privilege: 'partner', label: 'Partner User' },  
  { privilege: 'admin', label: 'Admin User (You)' }
];

console.log('🔒 BERKOMUNITASPLUS REWARD ACCESS TEST:\n');

testScenarios.forEach(scenario => {
  const canAccess = hasPrivilege(scenario.privilege, 'berkomunitasplus');
  const status = canAccess ? '✅ CAN ACCESS' : '❌ CANNOT ACCESS';
  
  console.log(`${scenario.label}:`);
  console.log(`   Privilege: ${scenario.privilege}`);
  console.log(`   Access berkomunitasplus rewards: ${status}`);
  console.log();
});

console.log('🔧 LOGIC CHANGES MADE:\n');
console.log('OLD Logic:');
console.log('   userHasBerkomunitsPlus = memberData?.privilege === "berkomunitasplus"');
console.log('   ❌ Only exact match - admin would be blocked');
console.log();
console.log('NEW Logic:');
console.log('   userHasBerkomunitsPlus = hasPrivilege(memberData?.privilege || "user", "berkomunitasplus")');
console.log('   ✅ Hierarchical check - admin has berkomunitasplus access');

console.log('\n🎯 EXPECTED RESULT FOR ADMIN:');
console.log('✅ Admin users can now access berkomunitasplus rewards');
console.log('✅ Hierarchical privilege system working correctly');
console.log('✅ No more "requires BerkomunitsPlus membership" error for admin');

console.log('\n🔗 Test at: http://localhost:3000/rewards');
console.log('💡 Try redeeming a berkomunitasplus reward as admin');