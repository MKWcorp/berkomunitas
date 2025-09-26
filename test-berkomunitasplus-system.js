/**
 * BerkomunitsPlus Privilege Management Script
 * Test and manage the new 4-tier privilege system
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function testPrivilegeSystem() {
  console.log('🔐 Testing BerkomunitsPlus Privilege System...\n');

  try {
    // 1. Test privilege table structure
    console.log('1️⃣ Testing privilege table structure...');
    
    const privilegeCount = await prisma.user_privileges.count();
    console.log(`✅ Found ${privilegeCount} privilege records`);

    // 2. Test privilege hierarchy
    console.log('\n2️⃣ Testing privilege hierarchy...');
    
    const privilegeDistribution = await prisma.$queryRaw`
      SELECT privilege, COUNT(*) as count
      FROM user_privileges
      WHERE is_active = true
      GROUP BY privilege
      ORDER BY privilege
    `;

    console.log('Current privilege distribution:');
    privilegeDistribution.forEach(p => {
      console.log(`   ${p.privilege}: ${p.count} members`);
    });

    // 3. Test some sample members
    console.log('\n3️⃣ Testing member privilege lookup...');
    
    const sampleMembers = await prisma.members.findMany({
      take: 5,
      select: {
        id: true,
        nama_lengkap: true,
        clerk_id: true
      }
    });

    for (const member of sampleMembers) {
      const privilege = await prisma.user_privileges.findFirst({
        where: {
          member_id: member.id,
          is_active: true
        },
        select: {
          privilege: true
        }
      });

      console.log(`   ${member.nama_lengkap || 'No Name'}: ${privilege?.privilege || 'user'}`);
    }

    // 4. Test rewards with privilege requirements
    console.log('\n4️⃣ Testing rewards with privilege requirements...');
    
    const rewardsWithPrivileges = await prisma.rewards.findMany({
      where: {
        required_privilege: {
          not: null
        }
      },
      select: {
        id: true,
        reward_name: true,
        required_privilege: true,
        point_cost: true
      },
      take: 10
    });

    if (rewardsWithPrivileges.length > 0) {
      console.log('Rewards requiring special privileges:');
      rewardsWithPrivileges.forEach(reward => {
        console.log(`   ${reward.reward_name}: requires ${reward.required_privilege} (${reward.point_cost} coins)`);
      });
    } else {
      console.log('   No rewards with privilege requirements found');
    }

    console.log('\n🎉 Privilege system test completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Privilege system test failed:', error.message);
    return false;
  }
}

async function upgradeMemberToBerkomunitasPlus(memberId, notes = 'Manual upgrade via script') {
  console.log(`🔄 Upgrading member ${memberId} to BerkomunitsPlus...`);

  try {
    // Check if member exists
    const member = await prisma.members.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        nama_lengkap: true,
        clerk_id: true
      }
    });

    if (!member) {
      throw new Error(`Member with ID ${memberId} not found`);
    }

    // Deactivate current privilege
    await prisma.user_privileges.updateMany({
      where: {
        member_id: memberId,
        is_active: true
      },
      data: {
        is_active: false
      }
    });

    // Grant berkomunitasplus privilege
    const newPrivilege = await prisma.user_privileges.create({
      data: {
        member_id: memberId,
        privilege: 'berkomunitasplus',
        is_active: true,
        notes: notes
      }
    });

    console.log(`✅ Successfully upgraded ${member.nama_lengkap} to BerkomunitsPlus`);
    return newPrivilege;

  } catch (error) {
    console.error(`❌ Failed to upgrade member ${memberId}:`, error.message);
    throw error;
  }
}

async function checkMemberPrivilege(clerkId) {
  console.log(`🔍 Checking privilege for clerk ID: ${clerkId}...`);

  try {
    const member = await prisma.members.findUnique({
      where: { clerk_id: clerkId },
      include: {
        user_privileges: {
          where: { is_active: true },
          select: {
            privilege: true,
            granted_at: true,
            expires_at: true,
            notes: true
          }
        }
      }
    });

    if (!member) {
      console.log('❌ Member not found');
      return null;
    }

    const privilege = member.user_privileges[0]?.privilege || 'user';
    
    console.log(`✅ Member: ${member.nama_lengkap}`);
    console.log(`   Privilege: ${privilege}`);
    console.log(`   Granted: ${member.user_privileges[0]?.granted_at || 'Default'}`);
    
    return {
      member,
      privilege
    };

  } catch (error) {
    console.error('❌ Failed to check member privilege:', error.message);
    return null;
  }
}

async function createTestBerkomunitasPlusReward() {
  console.log('🎁 Creating test BerkomunitsPlus reward...');

  try {
    const testReward = await prisma.rewards.create({
      data: {
        reward_name: 'Premium Gift Box - BerkomunitsPlus Exclusive',
        description: 'Exclusive premium gift box only available for BerkomunitsPlus members',
        point_cost: 500,
        stock: 10,
        is_active: true,
        required_privilege: 'berkomunitasplus',
        category_id: 1 // Adjust based on your categories
      }
    });

    console.log(`✅ Created test reward: ${testReward.reward_name} (ID: ${testReward.id})`);
    return testReward;

  } catch (error) {
    console.error('❌ Failed to create test reward:', error.message);
    return null;
  }
}

// Main execution
async function main() {
  console.log('🚀 BerkomunitsPlus Privilege System Management\n');

  try {
    // Test the system
    await testPrivilegeSystem();

    // Example usage (uncomment as needed):
    
    // // Check a specific member
    // await checkMemberPrivilege('your-clerk-id-here');
    
    // // Upgrade a member (replace with actual member ID)
    // await upgradeMemberToBerkomunitasPlus(1, 'Test upgrade');
    
    // // Create test reward
    // await createTestBerkomunitasPlusReward();

  } catch (error) {
    console.error('❌ Script execution failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper functions for command line usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    main();
  } else if (args[0] === 'test') {
    testPrivilegeSystem().then(() => prisma.$disconnect());
  } else if (args[0] === 'upgrade' && args[1]) {
    const memberId = parseInt(args[1]);
    const notes = args[2] || 'Command line upgrade';
    upgradeMemberToBerkomunitasPlus(memberId, notes).then(() => prisma.$disconnect());
  } else if (args[0] === 'check' && args[1]) {
    checkMemberPrivilege(args[1]).then(() => prisma.$disconnect());
  } else if (args[0] === 'create-test-reward') {
    createTestBerkomunitasPlusReward().then(() => prisma.$disconnect());
  } else {
    console.log('Usage:');
    console.log('  node test-berkomunitasplus-system.js                    - Run full test');
    console.log('  node test-berkomunitasplus-system.js test               - Test system only');
    console.log('  node test-berkomunitasplus-system.js upgrade <id>       - Upgrade member to Plus');
    console.log('  node test-berkomunitasplus-system.js check <clerk_id>   - Check member privilege');
    console.log('  node test-berkomunitasplus-system.js create-test-reward - Create test Plus reward');
    prisma.$disconnect();
  }
}

module.exports = {
  testPrivilegeSystem,
  upgradeMemberToBerkomunitasPlus,
  checkMemberPrivilege,
  createTestBerkomunitasPlusReward
};