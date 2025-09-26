/**
 * Loyalty-Coin Sync Test menggunakan Prisma yang sudah ada
 * Test untuk memverifikasi apakah trigger database masih bekerja
 */

// Import Prisma client yang sudah ada di project
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLoyaltyCoinSync() {
  console.log('🧪 Testing Loyalty-Coin Synchronization...\n');

  try {
    // 1. Cari user untuk testing
    console.log('🔍 Step 1: Finding test user...');
    
    const testUser = await prisma.user_accounts.findFirst({
      where: {
        AND: [
          { loyalty_point: { not: null } },
          { coin: { not: null } }
        ]
      },
      select: {
        user_id: true,
        email: true,
        display_name: true,
        loyalty_point: true,
        coin: true
      }
    });

    if (!testUser) {
      console.log('❌ No test user found');
      return;
    }

    console.log('✅ Test user found:');
    console.log(`   ID: ${testUser.user_id.substring(0, 8)}...`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Name: ${testUser.display_name || 'N/A'}`);
    console.log(`   Current Loyalty: ${testUser.loyalty_point}`);
    console.log(`   Current Coin: ${testUser.coin}\n`);

    // 2. Record initial values
    const initialLoyalty = parseInt(testUser.loyalty_point) || 0;
    const initialCoin = parseInt(testUser.coin) || 0;
    const testAmount = 1000;

    console.log('📊 Initial State:');
    console.log(`   Loyalty: ${initialLoyalty}`);
    console.log(`   Coin: ${initialCoin}\n`);

    // 3. Test 1: Direct loyalty update
    console.log(`🧪 Test 1: Adding ${testAmount} loyalty points...`);
    
    await prisma.user_accounts.update({
      where: { user_id: testUser.user_id },
      data: { loyalty_point: initialLoyalty + testAmount }
    });

    // Wait for potential database triggers
    console.log('⏳ Waiting for database triggers (2 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check result
    const afterUpdate = await prisma.user_accounts.findUnique({
      where: { user_id: testUser.user_id },
      select: { loyalty_point: true, coin: true }
    });

    const newLoyalty = parseInt(afterUpdate.loyalty_point) || 0;
    const newCoin = parseInt(afterUpdate.coin) || 0;

    console.log('📊 Results:');
    console.log(`   Loyalty: ${initialLoyalty} -> ${newLoyalty} (Expected: ${initialLoyalty + testAmount})`);
    console.log(`   Coin: ${initialCoin} -> ${newCoin} (Expected: ${initialCoin + testAmount} if sync works)`);

    const loyaltyCorrect = newLoyalty === (initialLoyalty + testAmount);
    const coinSynced = newCoin === (initialCoin + testAmount);

    console.log(`   ✅ Loyalty Updated: ${loyaltyCorrect ? 'YES' : 'NO'}`);
    console.log(`   ✅ Coin Auto-Synced: ${coinSynced ? 'YES' : 'NO'}\n`);

    // 4. Restore original values
    console.log('🔄 Restoring original values...');
    await prisma.user_accounts.update({
      where: { user_id: testUser.user_id },
      data: { 
        loyalty_point: initialLoyalty,
        coin: initialCoin
      }
    });
    console.log('✅ Values restored\n');

    // 5. Check for trigger existence via raw query
    console.log('🔍 Checking database triggers...');
    try {
      const triggers = await prisma.$queryRaw`
        SELECT 
          TRIGGER_NAME,
          EVENT_MANIPULATION,
          EVENT_OBJECT_TABLE
        FROM information_schema.TRIGGERS 
        WHERE EVENT_OBJECT_TABLE = 'user_accounts'
        AND ACTION_STATEMENT LIKE '%coin%'
      `;

      if (triggers.length === 0) {
        console.log('❌ No triggers found for coin sync');
      } else {
        console.log(`✅ Found ${triggers.length} trigger(s):`);
        triggers.forEach(trigger => {
          console.log(`   - ${trigger.TRIGGER_NAME} (${trigger.EVENT_MANIPULATION})`);
        });
      }
    } catch (error) {
      console.log('⚠️  Could not check triggers (permission issue)');
    }

    console.log('');

    // 6. Final diagnosis
    console.log('📋 DIAGNOSIS:');
    console.log('==============');
    
    if (coinSynced) {
      console.log('🟢 SUCCESS: Loyalty-Coin sync is working!');
      console.log('   Database triggers/functions are functioning correctly.');
      console.log('   When loyalty is updated, coin is automatically updated too.');
    } else {
      console.log('🔴 ISSUE DETECTED: Loyalty-Coin sync is NOT working!');
      console.log('   Database triggers/functions are missing or broken.');
      console.log('   When loyalty is updated, coin remains unchanged.');
      console.log('');
      console.log('💡 RECOMMENDATIONS:');
      console.log('   1. Check if database trigger exists and is active');
      console.log('   2. Update admin workflow to manually sync coin with loyalty');
      console.log('   3. Consider creating/restoring the automatic sync trigger');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Additional function to check current sync status
async function checkSyncStatus() {
  console.log('🔍 Checking Current Sync Status...\n');

  try {
    // Count total users
    const totalUsers = await prisma.user_accounts.count({
      where: {
        AND: [
          { loyalty_point: { not: null } },
          { coin: { not: null } }
        ]
      }
    });

    // Count users where loyalty === coin (perfect sync)
    const syncedUsers = await prisma.user_accounts.count({
      where: {
        AND: [
          { loyalty_point: { not: null } },
          { coin: { not: null } },
          { loyalty_point: { equals: prisma.user_accounts.fields.coin } }
        ]
      }
    });

    // Find some examples of mismatched users
    const mismatchedSamples = await prisma.user_accounts.findMany({
      where: {
        AND: [
          { loyalty_point: { not: null } },
          { coin: { not: null } },
          { NOT: { loyalty_point: { equals: prisma.user_accounts.fields.coin } } }
        ]
      },
      select: {
        user_id: true,
        email: true,
        display_name: true,
        loyalty_point: true,
        coin: true
      },
      take: 5
    });

    console.log(`📊 Current Status:`);
    console.log(`   Total users with both loyalty & coin: ${totalUsers}`);
    console.log(`   Users with matching loyalty/coin: ${syncedUsers}`);
    console.log(`   Users with mismatched values: ${totalUsers - syncedUsers}\n`);

    if (totalUsers === syncedUsers) {
      console.log('✅ Perfect sync! All users have matching loyalty and coin values.');
    } else {
      console.log('⚠️  Some users have mismatched loyalty/coin values:');
      console.log('   Sample mismatched users:');
      mismatchedSamples.forEach((user, index) => {
        const diff = parseInt(user.loyalty_point) - parseInt(user.coin);
        console.log(`   ${index + 1}. ${user.email}`);
        console.log(`      Loyalty: ${user.loyalty_point}, Coin: ${user.coin}, Diff: ${diff}`);
      });
    }

  } catch (error) {
    console.error('❌ Status check failed:', error);
  }
}

// Test dengan scenario admin manual addition
async function testAdminScenario() {
  console.log('\n🧪 Testing Admin Manual Addition Scenario...\n');

  try {
    // Cari user untuk testing
    const testUser = await prisma.user_accounts.findFirst({
      where: {
        AND: [
          { loyalty_point: { not: null } },
          { coin: { not: null } }
        ]
      }
    });

    if (!testUser) {
      console.log('❌ No test user found');
      return;
    }

    const initialLoyalty = parseInt(testUser.loyalty_point) || 0;
    const initialCoin = parseInt(testUser.coin) || 0;
    const adminAddAmount = 500;

    console.log('👨‍💼 Simulating admin manual loyalty addition...');
    console.log(`   Adding ${adminAddAmount} loyalty via admin action`);

    // Simulate what happens in admin interface
    const result = await prisma.$transaction(async (tx) => {
      // Update loyalty (this is what admin interface does)
      const updated = await tx.user_accounts.update({
        where: { user_id: testUser.user_id },
        data: { loyalty_point: { increment: adminAddAmount } }
      });

      return updated;
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check if coin was also updated
    const afterAdmin = await prisma.user_accounts.findUnique({
      where: { user_id: testUser.user_id },
      select: { loyalty_point: true, coin: true }
    });

    const adminNewLoyalty = parseInt(afterAdmin.loyalty_point);
    const adminNewCoin = parseInt(afterAdmin.coin);

    console.log('📊 Admin scenario results:');
    console.log(`   Loyalty: ${initialLoyalty} -> ${adminNewLoyalty} (Expected: ${initialLoyalty + adminAddAmount})`);
    console.log(`   Coin: ${initialCoin} -> ${adminNewCoin} (Expected: ${initialCoin + adminAddAmount} if sync works)`);

    const adminCoinSynced = adminNewCoin === (initialCoin + adminAddAmount);
    console.log(`   ✅ Coin synced in admin scenario: ${adminCoinSynced ? 'YES' : 'NO'}`);

    // Restore
    await prisma.user_accounts.update({
      where: { user_id: testUser.user_id },
      data: { 
        loyalty_point: initialLoyalty,
        coin: initialCoin
      }
    });

    return adminCoinSynced;

  } catch (error) {
    console.error('❌ Admin scenario test failed:', error);
    return false;
  }
}

// Main function
async function runAllTests() {
  console.log('🚀 Loyalty-Coin Synchronization Test Suite');
  console.log('==========================================\n');

  await checkSyncStatus();
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  await testLoyaltyCoinSync();
  
  const adminResult = await testAdminScenario();

  console.log('\n' + '='.repeat(60));
  console.log('📋 FINAL SUMMARY:');
  console.log('='.repeat(60));
  console.log(`Admin manual addition syncs coin: ${adminResult ? '✅ YES' : '❌ NO'}`);
  
  if (!adminResult) {
    console.log('\n🔧 ACTION REQUIRED:');
    console.log('   Database triggers for loyalty-coin sync are not working.');
    console.log('   You need to update the admin workflow to manually add coin when adding loyalty.');
    console.log('   Consider restoring the database trigger or implementing manual sync in code.');
  }
}

if (require.main === module) {
  runAllTests();
}

module.exports = { testLoyaltyCoinSync, checkSyncStatus, testAdminScenario };