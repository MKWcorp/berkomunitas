const { hasPrivilege } = require('./src/utils/privilegeChecker');

console.log('🔍 Testing Required Privilege Logic...\n');

// Test user privileges
const testUsers = [
  { privilege: 'user', name: 'Regular User' },
  { privilege: 'berkomunitasplus', name: 'BerkomunitsPlus User' },
  { privilege: 'partner', name: 'Partner User' },
  { privilege: 'admin', name: 'Admin User' }
];

// Test required privileges
const testRewards = [
  { name: 'Basic Reward', required_privilege: null },
  { name: 'User Reward', required_privilege: 'user' },
  { name: 'Plus Reward', required_privilege: 'berkomunitasplus' },
  { name: 'Partner Reward', required_privilege: 'partner' },
  { name: 'Admin Reward', required_privilege: 'admin' }
];

console.log('=== PRIVILEGE ACCESS MATRIX ===');
console.log('Reward Type         | User | Plus | Partner | Admin');
console.log('-'.repeat(60));

testRewards.forEach(reward => {
  const results = testUsers.map(user => {
    // Check if user has required privilege (hierarchical check)
    const hasAccess = !reward.required_privilege || 
      reward.required_privilege === 'user' || 
      hasPrivilege(user.privilege, reward.required_privilege);
    
    return hasAccess ? ' ✅ ' : ' ❌ ';
  });
  
  const rewardName = reward.name.padEnd(18);
  console.log(`${rewardName} |${results.join(' |')}`);
});

console.log('\n=== DETAILED TEST CASES ===');

// Test specific cases
const testCases = [
  { userPrivilege: 'user', requiredPrivilege: 'berkomunitasplus', expected: false },
  { userPrivilege: 'berkomunitasplus', requiredPrivilege: 'berkomunitasplus', expected: true },
  { userPrivilege: 'partner', requiredPrivilege: 'berkomunitasplus', expected: true },
  { userPrivilege: 'admin', requiredPrivilege: 'berkomunitasplus', expected: true },
  { userPrivilege: 'admin', requiredPrivilege: 'partner', expected: true },
  { userPrivilege: 'berkomunitasplus', requiredPrivilege: 'partner', expected: false },
];

testCases.forEach((testCase, index) => {
  const hasAccess = hasPrivilege(testCase.userPrivilege, testCase.requiredPrivilege);
  const result = hasAccess === testCase.expected ? '✅ PASS' : '❌ FAIL';
  
  console.log(`Test ${index + 1}: ${testCase.userPrivilege} -> ${testCase.requiredPrivilege}: ${hasAccess} (expected: ${testCase.expected}) ${result}`);
});

console.log('\n🎯 SUMMARY:');
console.log('- required_privilege now works as MINIMUM privilege requirement');
console.log('- Higher privilege users can access lower privilege rewards');
console.log('- Admin can access berkomunitasplus, partner, and user rewards');
console.log('- Partner can access berkomunitasplus and user rewards');
console.log('- BerkomunitsPlus can access user rewards');
console.log('- User can only access user/no-privilege rewards');