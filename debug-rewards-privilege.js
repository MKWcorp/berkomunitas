const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugRewardsPrivilegeData() {
  const clerkId = 'user_30yTnOAZrelMbgRiX4pajLlhLpB'; // Your admin clerk ID
  
  console.log('🔍 Debugging Rewards Page Privilege Data...');
  console.log('Clerk ID:', clerkId);
  console.log();
  
  try {
    // 1. Check member data that would be returned by rewards API
    const member = await prisma.members.findFirst({
      where: { clerk_id: clerkId },
      select: {
        id: true,
        nama_lengkap: true,
        coin: true,
        loyalty_point: true,
        user_privileges: {
          where: { is_active: true },
          select: {
            privilege: true,
            granted_at: true
          }
        }
      }
    });
    
    console.log('=== MEMBER DATA (as returned by /api/rewards/redeem) ===');
    if (member) {
      // Simulate the privilege field that would be set in the API
      const highestPrivilege = member.user_privileges && member.user_privileges.length > 0 
        ? member.user_privileges[0].privilege 
        : 'user';
      
      const memberData = {
        id: member.id,
        nama_lengkap: member.nama_lengkap,
        coin: member.coin,
        loyalty_point: member.loyalty_point,
        privilege: highestPrivilege // This is what rewards page uses
      };
      
      console.log('Member data:', memberData);
      console.log('Active privileges:', member.user_privileges);
    } else {
      console.log('❌ Member not found');
      return;
    }
    
    console.log();
    
    // 2. Test some berkomunitasplus rewards
    console.log('=== BERKOMUNITASPLUS REWARDS TEST ===');
    const berkomunitsRewards = await prisma.rewards.findMany({
      where: {
        required_privilege: 'berkomunitasplus'
      },
      select: {
        id: true,
        reward_name: true,
        required_privilege: true,
        point_cost: true,
        stock: true
      },
      take: 3
    });
    
    console.log('Sample berkomunitasplus rewards:');
    berkomunitsRewards.forEach(reward => {
      console.log(`   - ${reward.reward_name} (${reward.point_cost} coins, stock: ${reward.stock})`);
    });
    
    console.log();
    
    // 3. Simulate the logic check
    const { hasPrivilege } = require('./src/utils/privilegeChecker');
    const userPrivilege = member.user_privileges[0]?.privilege || 'user';
    const canAccessBerkomunitasplus = hasPrivilege(userPrivilege, 'berkomunitasplus');
    
    console.log('=== PRIVILEGE LOGIC TEST ===');
    console.log(`User privilege: ${userPrivilege}`);
    console.log(`Can access berkomunitasplus rewards: ${canAccessBerkomunitasplus ? 'YES ✅' : 'NO ❌'}`);
    
    if (canAccessBerkomunitasplus) {
      console.log('🎉 SUCCESS: Admin can access berkomunitasplus rewards!');
    } else {
      console.log('❌ PROBLEM: Admin still cannot access berkomunitasplus rewards');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRewardsPrivilegeData();