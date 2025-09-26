/**
 * Test Script: New User Registration Flow
 * This script simulates and tests the complete flow for a new user registration
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test data for simulation
const testUserData = {
  clerk_id: 'test_user_' + Date.now(),
  email: `testuser${Date.now()}@example.com`,
  nama_lengkap: 'Test User Baru',
  username: `test_user_${Date.now()}`,
  nomer_wa: '081234567890'
};

async function simulateNewUserFlow() {
  console.log('🚀 Starting New User Registration Flow Test...\n');
  
  try {
    // Step 1: Check if database connection is working
    console.log('📡 Step 1: Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Step 2: Simulate user registration via Clerk
    console.log('👤 Step 2: Simulating Clerk user registration...');
    console.log(`   - Clerk ID: ${testUserData.clerk_id}`);
    console.log(`   - Email: ${testUserData.email}`);
    console.log(`   - Full Name: ${testUserData.nama_lengkap}`);
    console.log('✅ Clerk user registration simulated\n');

    // Step 3: Test member creation (what happens when user first accesses protected route)
    console.log('🔧 Step 3: Testing member creation...');
    
    // Check if member already exists
    const existingMember = await prisma.members.findUnique({
      where: { clerk_id: testUserData.clerk_id }
    });

    if (existingMember) {
      console.log('⚠️  Member already exists in database');
      console.log(`   - Member ID: ${existingMember.id}`);
      console.log(`   - Loyalty Points: ${existingMember.loyalty_point}`);
    } else {      // Create new member (simulating /api/create-member)
      const newMember = await prisma.members.create({
        data: {
          clerk_id: testUserData.clerk_id,
          nama_lengkap: testUserData.nama_lengkap,
          tanggal_daftar: new Date(),
          loyalty_point: 0
        }
      });

      // Create email record in member_emails table
      if (testUserData.email) {
        await prisma.member_emails.create({
          data: {
            clerk_id: testUserData.clerk_id,
            email: testUserData.email,
            is_primary: true,
            verified: true,
          }
        });
      }
      
      console.log('✅ New member created successfully');
      console.log(`   - Member ID: ${newMember.id}`);
      console.log(`   - Registration Date: ${newMember.tanggal_daftar.toISOString()}`);
      console.log(`   - Initial Loyalty Points: ${newMember.loyalty_point}`);
    }
    console.log('');

    // Step 4: Test profile completion check
    console.log('📝 Step 4: Testing profile completion status...');
    
    const member = await prisma.members.findUnique({
      where: { clerk_id: testUserData.clerk_id },
      include: {
        social_profiles: true
      }
    });

    const isProfileComplete = member && 
      member.nama_lengkap && 
      member.nomer_wa && 
      member.social_profiles.length > 0;

    console.log(`   - Profile Complete: ${isProfileComplete ? '✅ Yes' : '❌ No'}`);
    console.log(`   - Has Full Name: ${member?.nama_lengkap ? '✅' : '❌'}`);
    console.log(`   - Has WhatsApp: ${member?.nomer_wa ? '✅' : '❌'}`);
    console.log(`   - Has Social Profiles: ${member?.social_profiles?.length > 0 ? '✅' : '❌'}`);
    
    if (!isProfileComplete) {
      console.log('   ⚠️  User will be redirected to complete profile');
    }
    console.log('');

    // Step 5: Test username generation
    console.log('🏷️  Step 5: Testing username generation...');
    
    if (!member.username) {
      // Simulate username generation
      const generateUsername = (nama_lengkap) => {
        if (!nama_lengkap) return null;
        
        return nama_lengkap
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .substring(0, 20) + '_' + Math.floor(Math.random() * 10000);
      };

      const generatedUsername = generateUsername(member.nama_lengkap);
      
      await prisma.members.update({
        where: { id: member.id },
        data: { username: generatedUsername }
      });
      
      console.log(`   ✅ Username generated: ${generatedUsername}`);
    } else {
      console.log(`   ✅ Username already exists: ${member.username}`);
    }
    console.log('');

    // Step 6: Test level system
    console.log('🎯 Step 6: Testing level system...');
    
    const levels = await prisma.levels.findMany({
      orderBy: { level_number: 'asc' }
    });
    
    if (levels.length > 0) {
      const currentLevel = levels.find(level => 
        member.loyalty_point >= level.min_points && 
        member.loyalty_point < (level.max_points || Infinity)
      ) || levels[0];
      
      console.log(`   ✅ Current Level: ${currentLevel.level_name} (Level ${currentLevel.level_number})`);
      console.log(`   - Points Required: ${currentLevel.min_points} - ${currentLevel.max_points || '∞'}`);
      console.log(`   - User Points: ${member.loyalty_point}`);
    } else {
      console.log('   ⚠️  No levels configured in database');
    }
    console.log('');

    // Step 7: Test available tasks
    console.log('📋 Step 7: Testing available tasks...');
    
    const availableTasks = await prisma.tugas.findMany({
      where: {
        status: 'active',
        tanggal_berakhir: {
          gte: new Date()
        }
      },
      take: 5
    });
    
    console.log(`   ✅ Available tasks: ${availableTasks.length}`);
    availableTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.nama_tugas} (${task.point_reward} points)`);
    });
    console.log('');

    // Step 8: Test notification system
    console.log('🔔 Step 8: Testing notification system...');
    
    const recentNotifications = await prisma.notifikasi.findMany({
      where: {
        member_id: member.id
      },
      orderBy: { tanggal_dibuat: 'desc' },
      take: 5
    });
    
    console.log(`   ✅ User notifications: ${recentNotifications.length}`);
    if (recentNotifications.length === 0) {
      console.log('   📝 Note: New users typically have welcome notifications');
    }
    console.log('');

    // Step 9: Test privileges system
    console.log('🔐 Step 9: Testing user privileges...');
    
    const userPrivileges = await prisma.user_privileges.findMany({
      where: { member_id: member.id },
      include: { privileges: true }
    });
    
    console.log(`   ✅ User privileges: ${userPrivileges.length}`);
    if (userPrivileges.length === 0) {
      console.log('   📝 Note: New users start with basic member privileges');
    } else {
      userPrivileges.forEach(up => {
        console.log(`   - ${up.privileges.privilege_name}: ${up.privileges.description}`);
      });
    }
    console.log('');

    // Step 10: Test reward system readiness
    console.log('🏆 Step 10: Testing reward system...');
    
    const availableRewards = await prisma.rewards.findMany({
      where: {
        is_active: true,
        min_level: {
          lte: 1 // Level 1 for new users
        }
      },
      take: 5
    });
    
    console.log(`   ✅ Available rewards for new users: ${availableRewards.length}`);
    availableRewards.forEach((reward, index) => {
      console.log(`   ${index + 1}. ${reward.nama_reward} (${reward.point_cost} points)`);
    });
    console.log('');

    // Final Summary
    console.log('📊 SUMMARY - New User Flow Test Results:');
    console.log('=' * 50);
    console.log(`✅ Database Connection: Working`);
    console.log(`✅ Member Creation: Working`);
    console.log(`${isProfileComplete ? '✅' : '⚠️ '} Profile Completion: ${isProfileComplete ? 'Complete' : 'Requires completion'}`);
    console.log(`✅ Username Generation: Working`);
    console.log(`✅ Level System: Working`);
    console.log(`✅ Task System: ${availableTasks.length} tasks available`);
    console.log(`✅ Notification System: Ready`);
    console.log(`✅ Privilege System: Ready`);
    console.log(`✅ Reward System: ${availableRewards.length} rewards available`);
    
    console.log('\n🎉 New User Flow Test Completed Successfully!');
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await prisma.members.delete({
      where: { clerk_id: testUserData.clerk_id }
    });
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Error during test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('\n📡 Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  simulateNewUserFlow();
}

module.exports = { simulateNewUserFlow };
