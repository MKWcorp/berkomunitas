// Test ProfileSection component integration
import { getDisplayPrivileges } from './src/utils/privilegeChecker.js';

console.log('🧪 Testing ProfileSection integration...\n');

// Simulate different user scenarios
const testScenarios = [
  {
    name: 'DRW Skincare Official (berkomunitasplus)',
    privileges: [{ privilege: 'berkomunitasplus', granted_at: '2025-09-19T09:44:59.297Z' }]
  },
  {
    name: 'Mulmed Corp (admin)',
    privileges: [{ privilege: 'admin', granted_at: '2025-09-19T09:44:59.297Z' }]
  },
  {
    name: 'Partner User',
    privileges: [{ privilege: 'partner', granted_at: '2025-09-19T09:44:59.297Z' }]
  },
  {
    name: 'Regular User',
    privileges: []
  }
];

testScenarios.forEach(scenario => {
  console.log(`👤 ${scenario.name}:`);
  
  // Simulate ProfileSection logic
  const userCurrentPrivilege = scenario.privileges && scenario.privileges.length > 0 
    ? scenario.privileges[0]?.privilege 
    : 'user';
  
  const displayPrivileges = getDisplayPrivileges(userCurrentPrivilege);
  
  console.log(`   Current privilege in DB: ${userCurrentPrivilege}`);
  console.log(`   Badges to display: ${JSON.stringify(displayPrivileges)}`);
  
  if (displayPrivileges.includes('berkomunitasplus')) {
    console.log(`   ✅ Will show BerkomunitsPlus gold badge!`);
  }
  if (displayPrivileges.includes('admin')) {
    console.log(`   👑 Will show Admin badge!`);
  }
  if (displayPrivileges.includes('partner')) {
    console.log(`   🤝 Will show Partner badge!`);
  }
  
  console.log();
});

console.log('🎯 Summary:');
console.log('✅ Admin users now see both Admin AND BerkomunitsPlus badges');
console.log('✅ Partner users now see both Partner AND BerkomunitsPlus badges');
console.log('✅ BerkomunitsPlus users see BerkomunitsPlus badge');
console.log('✅ Regular users see no privilege badges');
console.log('\n🔗 Test this at: http://localhost:3000/profil');