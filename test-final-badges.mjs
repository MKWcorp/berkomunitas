// Test final hierarchical privilege display system
import { getDisplayPrivileges } from './src/utils/privilegeChecker.js';

console.log('🎯 Final Test - Hierarchical Privilege Display System\n');

// Test all scenarios
const testScenarios = [
  {
    name: 'Admin User (like you)',
    privileges: [{ privilege: 'admin', granted_at: '2025-07-21T14:08:54.823Z' }]
  },
  {
    name: 'Partner User',
    privileges: [{ privilege: 'partner', granted_at: '2025-09-19T09:44:59.297Z' }]
  },
  {
    name: 'BerkomunitsPlus User (like DRW)',
    privileges: [{ privilege: 'berkomunitasplus', granted_at: '2025-09-19T09:44:59.297Z' }]
  },
  {
    name: 'Regular User',
    privileges: [{ privilege: 'user', granted_at: '2025-09-19T09:44:59.297Z' }]
  }
];

testScenarios.forEach(scenario => {
  console.log(`👤 ${scenario.name}:`);
  
  // Simulate new ProfileSection logic
  const getHighestPrivilege = (privileges) => {
    if (!privileges || privileges.length === 0) return 'user';
    
    const privilegeHierarchy = { 'user': 1, 'berkomunitasplus': 2, 'partner': 3, 'admin': 4 };
    let highest = 'user';
    let highestLevel = 0;
    
    privileges.forEach(p => {
      const level = privilegeHierarchy[p.privilege] || 0;
      if (level > highestLevel) {
        highest = p.privilege;
        highestLevel = level;
      }
    });
    
    return highest;
  };
  
  const userCurrentPrivilege = getHighestPrivilege(scenario.privileges);
  const displayPrivileges = getDisplayPrivileges(userCurrentPrivilege);
  
  console.log(`   Privilege in DB: ${userCurrentPrivilege}`);
  console.log(`   Badges shown: ${displayPrivileges.join(', ')}`);
  
  // Badge details
  const badgeDetails = displayPrivileges.map(p => {
    switch(p) {
      case 'user': return '👤 Member (Blue)';
      case 'berkomunitasplus': return '⭐ BerkomunitsPlus (Gold Gradient)';
      case 'partner': return '🤝 Partner (Purple)';
      case 'admin': return '👑 Admin (Red)';
    }
  });
  
  console.log(`   Visual: ${badgeDetails.join(' + ')}`);
  console.log();
});

console.log('🎨 Badge Color Scheme:');
console.log('👤 Member: Blue gradient (from-blue-500 to-blue-600)');
console.log('⭐ BerkomunitsPlus: Gold gradient (from-yellow-400 via-amber-500 to-yellow-600)');
console.log('🤝 Partner: Purple gradient (from-purple-500 to-purple-600)');
console.log('👑 Admin: Red gradient (from-red-500 to-red-600)');

console.log('\n✅ Your Profile (Admin) will now show:');
console.log('   👤 Member + ⭐ BerkomunitsPlus + 🤝 Partner + 👑 Admin');
console.log('\n🔗 Test at: http://localhost:3000/profil');