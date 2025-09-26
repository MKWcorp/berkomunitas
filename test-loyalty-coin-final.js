/**
 * Final Loyalty-Coin Sync Test
 * Test untuk memverifikasi apakah trigger database masih bekerja setelah database aktif
 */

const { execSync } = require('child_process');

async function testLoyaltyCoinSync() {
  console.log('🧪 Testing Loyalty-Coin Synchronization...\n');
  console.log('Database is now active. Running comprehensive test...\n');

  try {
    // Import Prisma menggunakan dynamic import untuk menghindari masalah ES modules
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

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
      console.log('❌ No test user found with both loyalty and coin data');
      await prisma.$disconnect();
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

    // 3. Test loyalty update
    console.log(`🧪 Test: Adding ${testAmount} loyalty points...`);
    
    await prisma.user_accounts.update({
      where: { user_id: testUser.user_id },
      data: { loyalty_point: initialLoyalty + testAmount }
    });

    console.log('⏳ Waiting 3 seconds for database triggers...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check result
    const afterUpdate = await prisma.user_accounts.findUnique({
      where: { user_id: testUser.user_id },
      select: { loyalty_point: true, coin: true }
    });

    const newLoyalty = parseInt(afterUpdate.loyalty_point) || 0;
    const newCoin = parseInt(afterUpdate.coin) || 0;

    console.log('📊 Results:');
    console.log(`   Loyalty: ${initialLoyalty} -> ${newLoyalty} (Expected: ${initialLoyalty + testAmount})`);
    console.log(`   Coin: ${initialCoin} -> ${newCoin} (Expected: ${initialCoin + testAmount} if trigger works)`);

    const loyaltyCorrect = newLoyalty === (initialLoyalty + testAmount);
    const coinSynced = newCoin === (initialCoin + testAmount);

    console.log(`   ✅ Loyalty Updated: ${loyaltyCorrect ? 'YES' : 'NO'}`);
    console.log(`   ✅ Coin Auto-Synced: ${coinSynced ? 'YES' : 'NO'}\n`);

    // 4. Check database triggers
    console.log('🔍 Checking database triggers...');
    try {
      const triggers = await prisma.$queryRaw`
        SELECT 
          TRIGGER_NAME,
          EVENT_MANIPULATION,
          EVENT_OBJECT_TABLE,
          ACTION_STATEMENT
        FROM information_schema.TRIGGERS 
        WHERE EVENT_OBJECT_TABLE = 'user_accounts'
        AND (ACTION_STATEMENT LIKE '%coin%' OR ACTION_STATEMENT LIKE '%loyalty%')
      `;

      console.log(`   Found ${triggers.length} relevant trigger(s):`);
      if (triggers.length === 0) {
        console.log('   ❌ No triggers found for loyalty-coin sync');
      } else {
        triggers.forEach((trigger, index) => {
          console.log(`   ${index + 1}. ${trigger.TRIGGER_NAME} (${trigger.EVENT_MANIPULATION})`);
        });
      }
    } catch (error) {
      console.log('   ⚠️  Could not check triggers:', error.message);
    }

    // 5. Test admin scenario (increment operation)
    console.log('\n🧪 Admin Scenario Test: Using increment operation...');
    
    // Reset first
    await prisma.user_accounts.update({
      where: { user_id: testUser.user_id },
      data: { 
        loyalty_point: initialLoyalty,
        coin: initialCoin
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Now test with increment (like admin interface)
    await prisma.user_accounts.update({
      where: { user_id: testUser.user_id },
      data: { loyalty_point: { increment: 500 } }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const afterIncrement = await prisma.user_accounts.findUnique({
      where: { user_id: testUser.user_id },
      select: { loyalty_point: true, coin: true }
    });

    const incrementLoyalty = parseInt(afterIncrement.loyalty_point);
    const incrementCoin = parseInt(afterIncrement.coin);
    const incrementCoinSynced = incrementCoin === (initialCoin + 500);

    console.log(`   Loyalty after increment: ${initialLoyalty} -> ${incrementLoyalty}`);
    console.log(`   Coin after increment: ${initialCoin} -> ${incrementCoin}`);
    console.log(`   ✅ Increment scenario coin synced: ${incrementCoinSynced ? 'YES' : 'NO'}\n`);

    // 6. Restore original values
    console.log('🔄 Restoring original values...');
    await prisma.user_accounts.update({
      where: { user_id: testUser.user_id },
      data: { 
        loyalty_point: initialLoyalty,
        coin: initialCoin
      }
    });
    console.log('✅ Values restored\n');

    // 7. Final diagnosis
    console.log('📋 FINAL DIAGNOSIS:');
    console.log('===================');
    
    if (coinSynced && incrementCoinSynced) {
      console.log('🟢 EXCELLENT: Loyalty-Coin sync is working perfectly!');
      console.log('   Both direct updates and increment operations trigger coin sync.');
      console.log('   Database triggers/functions are functioning correctly.');
    } else if (coinSynced || incrementCoinSynced) {
      console.log('🟡 PARTIAL: Loyalty-Coin sync works in some scenarios.');
      console.log(`   Direct update sync: ${coinSynced ? 'Working' : 'Not working'}`);
      console.log(`   Increment operation sync: ${incrementCoinSynced ? 'Working' : 'Not working'}`);
      console.log('   Check trigger conditions or implementation.');
    } else {
      console.log('🔴 ISSUE: Loyalty-Coin sync is NOT working!');
      console.log('   Database triggers/functions are missing or broken.');
      console.log('   When loyalty is updated, coin remains unchanged.');
      console.log('');
      console.log('🔧 RECOMMENDATIONS:');
      console.log('   1. Database triggers are missing - need to be restored');
      console.log('   2. Update admin workflow to manually sync coin with loyalty');
      console.log('   3. Implement manual sync in admin API endpoints');
      console.log('');
      console.log('💡 IMMEDIATE ACTION NEEDED:');
      console.log('   Update admin points addition workflow to also add coin');
    }

    await prisma.$disconnect();
    return { coinSynced, incrementCoinSynced, triggersFound: triggers?.length || 0 };

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Stack:', error.stack);
    return null;
  }
}

// Quick status check
async function quickStatusCheck() {
  console.log('🔍 Quick Database Status Check...\n');

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection: OK');

    // Count users with data
    const userCount = await prisma.user_accounts.count({
      where: {
        AND: [
          { loyalty_point: { not: null } },
          { coin: { not: null } }
        ]
      }
    });
    console.log(`✅ Users with loyalty & coin data: ${userCount}`);

    // Sample some data
    const sampleUsers = await prisma.user_accounts.findMany({
      where: {
        AND: [
          { loyalty_point: { not: null } },
          { coin: { not: null } }
        ]
      },
      select: {
        loyalty_point: true,
        coin: true
      },
      take: 5
    });

    console.log('📊 Sample data:');
    sampleUsers.forEach((user, index) => {
      const loyaltyInt = parseInt(user.loyalty_point);
      const coinInt = parseInt(user.coin);
      const match = loyaltyInt === coinInt;
      console.log(`   ${index + 1}. Loyalty: ${loyaltyInt}, Coin: ${coinInt} ${match ? '✅' : '❌'}`);
    });

    await prisma.$disconnect();
    console.log('');
    return true;

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Loyalty-Coin Synchronization Test Suite');
  console.log('==========================================\n');

  const dbOk = await quickStatusCheck();
  
  if (!dbOk) {
    console.log('❌ Database not accessible. Please check connection.');
    return;
  }

  console.log('='.repeat(60) + '\n');
  
  const results = await testLoyaltyCoinSync();

  if (results) {
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY FOR ACTION:');
    console.log('='.repeat(60));
    
    if (!results.coinSynced && !results.incrementCoinSynced) {
      console.log('🚨 CRITICAL: Loyalty-Coin sync is BROKEN!');
      console.log('');
      console.log('👨‍💼 Admin Action Required:');
      console.log('   1. When adding loyalty points manually, also add the same amount to coin');
      console.log('   2. Update admin API to sync both loyalty and coin');
      console.log('   3. Consider restoring database triggers for automatic sync');
      console.log('');
      console.log('📝 Example fix for admin manual points:');
      console.log('   Instead of: UPDATE user_accounts SET loyalty_point = loyalty_point + 1000');
      console.log('   Use: UPDATE user_accounts SET loyalty_point = loyalty_point + 1000, coin = coin + 1000');
    } else {
      console.log('✅ Loyalty-Coin sync is working correctly!');
      console.log('   No action needed. Automatic sync is functioning.');
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testLoyaltyCoinSync, quickStatusCheck };