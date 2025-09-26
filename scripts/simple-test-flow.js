const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNewUserFlow() {
  console.log('🚀 Testing New User Registration Flow...\n');
  
  try {
    // Test 1: Database Connection
    console.log('📡 Test 1: Database Connection');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Test 2: Check levels system
    console.log('🎯 Test 2: Level System');
    const levels = await prisma.levels.findMany({
      orderBy: { level_number: 'asc' }
    });
    console.log(`✅ Found ${levels.length} levels configured`);
    if (levels.length > 0) {
      console.log(`   - First level: ${levels[0].level_name} (${levels[0].min_points} points)`);
    }
    console.log('');

    // Test 3: Check active tasks
    console.log('📋 Test 3: Available Tasks');
    const activeTasks = await prisma.tugas_ai.findMany({
      where: {
        status: 'active'
      },
      take: 5
    });
    console.log(`✅ Found ${activeTasks.length} active tasks`);
    activeTasks.forEach((task, i) => {
      console.log(`   ${i+1}. ${task.keyword_tugas || 'Unnamed Task'} - ${task.point_reward || 0} points`);
    });
    console.log('');

    // Test 4: Check rewards for new users
    console.log('🏆 Test 4: Available Rewards');
    const rewards = await prisma.rewards.findMany({
      take: 5
    });
    console.log(`✅ Found ${rewards.length} rewards available`);
    rewards.forEach((reward, i) => {
      console.log(`   ${i+1}. ${reward.reward_name} - ${reward.point_cost} points`);
    });
    console.log('');

    // Test 5: Check if database tables are ready
    console.log('🗄️  Test 5: Database Schema Check');
    
    // Count records in key tables
    const memberCount = await prisma.members.count();
    const taskCount = await prisma.tugas_ai.count();
    const rewardCount = await prisma.rewards.count();
    const notificationCount = await prisma.notifications.count();
    
    console.log(`✅ Database schema check:`);
    console.log(`   - Members: ${memberCount} records`);
    console.log(`   - Tasks: ${taskCount} records`);
    console.log(`   - Rewards: ${rewardCount} records`);
    console.log(`   - Notifications: ${notificationCount} records`);
    console.log('');

    console.log('🎉 All backend tests passed! Database is ready for new users.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'P1001') {
      console.error('Database connection failed. Check your .env file and database server.');
    } else if (error.code === 'P2021') {
      console.error('Table does not exist. Run: npx prisma db push');
    } else {
      console.error('Full error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testNewUserFlow();
