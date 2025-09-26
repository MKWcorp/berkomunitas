const { PrismaClient } = require('@prisma/client');
const { getDisplayPrivileges, hasPrivilege } = require('./src/utils/privilegeChecker');

const prisma = new PrismaClient();

async function testHierarchicalPrivileges() {
  console.log('🧪 Testing Hierarchical Privilege Display System...\n');
  
  try {
    // Test different privilege levels
    const testCases = [
      { privilege: 'user', expected: [] },
      { privilege: 'berkomunitasplus', expected: ['berkomunitasplus'] },
      { privilege: 'partner', expected: ['partner', 'berkomunitasplus'] },
      { privilege: 'admin', expected: ['admin', 'berkomunitasplus'] }
    ];
    
    console.log('1️⃣ Testing getDisplayPrivileges function...');
    testCases.forEach(test => {
      const result = getDisplayPrivileges(test.privilege);
      const matches = JSON.stringify(result.sort()) === JSON.stringify(test.expected.sort());
      
      console.log(`   ${test.privilege}: ${JSON.stringify(result)} ${matches ? '✅' : '❌'}`);
      if (!matches) {
        console.log(`      Expected: ${JSON.stringify(test.expected)}`);
      }
    });
    
    console.log('\n2️⃣ Testing hierarchical access...');
    
    // Test berkomunitasplus access
    console.log('   berkomunitasplus user accessing berkomunitasplus features:',
      hasPrivilege('berkomunitasplus', 'berkomunitasplus') ? '✅' : '❌');
    
    // Test partner access
    console.log('   partner user accessing berkomunitasplus features:',
      hasPrivilege('partner', 'berkomunitasplus') ? '✅' : '❌');
    console.log('   partner user accessing partner features:',
      hasPrivilege('partner', 'partner') ? '✅' : '❌');
    
    // Test admin access  
    console.log('   admin user accessing berkomunitasplus features:',
      hasPrivilege('admin', 'berkomunitasplus') ? '✅' : '❌');
    console.log('   admin user accessing partner features:',
      hasPrivilege('admin', 'partner') ? '✅' : '❌');
    console.log('   admin user accessing admin features:',
      hasPrivilege('admin', 'admin') ? '✅' : '❌');
    
    console.log('\n3️⃣ Testing with real database users...');
    
    // Find some actual users to test
    const adminUsers = await prisma.user_privileges.findMany({
      where: { 
        privilege: 'admin',
        is_active: true 
      },
      take: 1,
      include: {
        members: {
          select: {
            nama_lengkap: true,
            member_emails: {
              select: { email: true },
              take: 1
            }
          }
        }
      }
    });
    
    const partnerUsers = await prisma.user_privileges.findMany({
      where: { 
        privilege: 'partner',
        is_active: true 
      },
      take: 1,
      include: {
        members: {
          select: {
            nama_lengkap: true,
            member_emails: {
              select: { email: true },
              take: 1
            }
          }
        }
      }
    });
    
    const berkomunitasplusUsers = await prisma.user_privileges.findMany({
      where: { 
        privilege: 'berkomunitasplus',
        is_active: true 
      },
      take: 1,
      include: {
        members: {
          select: {
            nama_lengkap: true,
            member_emails: {
              select: { email: true },
              take: 1
            }
          }
        }
      }
    });
    
    if (adminUsers.length > 0) {
      const admin = adminUsers[0];
      const displayPrivileges = getDisplayPrivileges('admin');
      console.log(`   Admin "${admin.members?.nama_lengkap}" should see badges:`, displayPrivileges);
    }
    
    if (partnerUsers.length > 0) {
      const partner = partnerUsers[0];
      const displayPrivileges = getDisplayPrivileges('partner');
      console.log(`   Partner "${partner.members?.nama_lengkap}" should see badges:`, displayPrivileges);
    }
    
    if (berkomunitasplusUsers.length > 0) {
      const berkomunitasplus = berkomunitasplusUsers[0];
      const displayPrivileges = getDisplayPrivileges('berkomunitasplus');
      console.log(`   BerkomunitsPlus "${berkomunitasplus.members?.nama_lengkap}" should see badges:`, displayPrivileges);
    }
    
    console.log('\n🎯 UI Impact:');
    console.log('   - Admin users will see: Admin badge + BerkomunitsPlus badge');
    console.log('   - Partner users will see: Partner badge + BerkomunitsPlus badge');
    console.log('   - BerkomunitsPlus users will see: BerkomunitsPlus badge');
    console.log('   - Regular users will see: No privilege badges');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testHierarchicalPrivileges();