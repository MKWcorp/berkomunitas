/**
 * Testing Script: Loyalty-Coin Synchronization
 * Menguji apakah penambahan loyalty otomatis menambahkan coin
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLoyaltyCoinSync() {
  console.log('🧪 Starting Loyalty-Coin Synchronization Test...\n');

  try {
    // 1. Pilih user untuk testing (ambil user pertama yang ada)
    const testUser = await prisma.user_accounts.findFirst({
      where: {
        loyalty_point: { not: null },
        coin: { not: null }
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
      console.log('❌ No test user found with loyalty and coin data');
      return;
    }

    console.log('👤 Test User Selected:');
    console.log(`   ID: ${testUser.user_id}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Name: ${testUser.display_name}`);
    console.log(`   Current Loyalty: ${testUser.loyalty_point}`);
    console.log(`   Current Coin: ${testUser.coin}\n`);

    // 2. Record initial values
    const initialLoyalty = testUser.loyalty_point || 0;
    const initialCoin = testUser.coin || 0;
    const testAmount = 1000;

    console.log('📊 Initial State:');
    console.log(`   Loyalty Point: ${initialLoyalty}`);
    console.log(`   Coin: ${initialCoin}\n`);

    // 3. Test Case 1: Direct loyalty update via Prisma
    console.log('🧪 TEST CASE 1: Direct Loyalty Update via Prisma');
    console.log(`   Adding ${testAmount} loyalty points directly...`);
    
    await prisma.user_accounts.update({
      where: { user_id: testUser.user_id },
      data: { 
        loyalty_point: initialLoyalty + testAmount 
      }
    });

    // Wait a moment for triggers to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check result
    const afterDirectUpdate = await prisma.user_accounts.findUnique({
      where: { user_id: testUser.user_id },
      select: { loyalty_point: true, coin: true }
    });

    console.log('   Results after direct update:');
    console.log(`   Loyalty Point: ${afterDirectUpdate.loyalty_point} (Expected: ${initialLoyalty + testAmount})`);
    console.log(`   Coin: ${afterDirectUpdate.coin} (Expected: ${initialCoin + testAmount} if trigger works)`);
    
    const directLoyaltyCorrect = afterDirectUpdate.loyalty_point === (initialLoyalty + testAmount);
    const directCoinSynced = afterDirectUpdate.coin === (initialCoin + testAmount);
    
    console.log(`   ✅ Loyalty Updated: ${directLoyaltyCorrect ? 'YES' : 'NO'}`);
    console.log(`   ✅ Coin Auto-Synced: ${directCoinSynced ? 'YES' : 'NO'}`);
    console.log('');

    // 4. Reset untuk test berikutnya
    await prisma.user_accounts.update({
      where: { user_id: testUser.user_id },
      data: { 
        loyalty_point: initialLoyalty,
        coin: initialCoin
      }
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // 5. Test Case 2: Simulating admin manual point addition
    console.log('🧪 TEST CASE 2: Admin Manual Point Addition Simulation');
    console.log(`   Simulating admin adding ${testAmount} loyalty via admin interface...`);

    // Simulate what happens when admin adds points manually
    const adminAddResult = await prisma.$transaction(async (tx) => {
      // Update loyalty
      const updatedUser = await tx.user_accounts.update({
        where: { user_id: testUser.user_id },
        data: { 
          loyalty_point: { increment: testAmount }
        },
        select: { loyalty_point: true, coin: true }
      });

      return updatedUser;
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    const afterAdminUpdate = await prisma.user_accounts.findUnique({
      where: { user_id: testUser.user_id },
      select: { loyalty_point: true, coin: true }
    });

    console.log('   Results after admin simulation:');
    console.log(`   Loyalty Point: ${afterAdminUpdate.loyalty_point} (Expected: ${initialLoyalty + testAmount})`);
    console.log(`   Coin: ${afterAdminUpdate.coin} (Expected: ${initialCoin + testAmount} if trigger works)`);
    
    const adminLoyaltyCorrect = afterAdminUpdate.loyalty_point === (initialLoyalty + testAmount);
    const adminCoinSynced = afterAdminUpdate.coin === (initialCoin + testAmount);
    
    console.log(`   ✅ Loyalty Updated: ${adminLoyaltyCorrect ? 'YES' : 'NO'}`);
    console.log(`   ✅ Coin Auto-Synced: ${adminCoinSynced ? 'YES' : 'NO'}`);
    console.log('');

    // 6. Test Case 3: Check for database triggers/functions
    console.log('🧪 TEST CASE 3: Database Triggers/Functions Check');
    
    try {
      // Check for triggers related to loyalty/coin sync
      const triggers = await prisma.$queryRaw`
        SELECT 
          trigger_name,
          event_manipulation,
          event_object_table,
          action_statement
        FROM information_schema.triggers 
        WHERE event_object_table = 'user_accounts' 
        AND (action_statement LIKE '%loyalty%' OR action_statement LIKE '%coin%')
      `;

      console.log('   Database triggers found:');
      if (triggers.length === 0) {
        console.log('   ❌ No triggers found for loyalty-coin sync');
      } else {
        triggers.forEach(trigger => {
          console.log(`   ✅ Trigger: ${trigger.trigger_name} (${trigger.event_manipulation})`);
        });
      }
    } catch (error) {
      console.log('   ⚠️  Could not check triggers (might need elevated permissions)');
    }

    console.log('');

    // 7. Final Summary
    console.log('📋 SUMMARY REPORT:');
    console.log('================');
    console.log(`Direct Update - Coin Synced: ${directCoinSynced ? '✅ YES' : '❌ NO'}`);
    console.log(`Admin Simulation - Coin Synced: ${adminCoinSynced ? '✅ YES' : '❌ NO'}`);

    if (!directCoinSynced && !adminCoinSynced) {
      console.log('\n🔴 ISSUE DETECTED:');
      console.log('   Loyalty updates are NOT automatically syncing with coin.');
      console.log('   This suggests that database triggers/functions are missing or not working.');
      console.log('   Recommendation: Update workflow to manually sync coin when loyalty is updated.');
    } else if (directCoinSynced && adminCoinSynced) {
      console.log('\n🟢 ALL GOOD:');
      console.log('   Loyalty updates are automatically syncing with coin.');
      console.log('   Database triggers/functions are working correctly.');
    } else {
      console.log('\n🟡 PARTIAL ISSUE:');
      console.log('   Some loyalty updates sync coin, others don\'t.');
      console.log('   Check specific conditions or trigger implementations.');
    }

    // Reset to original state
    await prisma.user_accounts.update({
      where: { user_id: testUser.user_id },
      data: { 
        loyalty_point: initialLoyalty,
        coin: initialCoin
      }
    });

    console.log('\n✅ Test completed. User data restored to original state.');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Additional utility function to check current sync status
async function checkCurrentSyncStatus() {
  console.log('🔍 Checking Current Loyalty-Coin Sync Status...\n');

  try {
    // Get users where loyalty and coin don't match (if they should match 1:1)
    const mismatchedUsers = await prisma.user_accounts.findMany({
      where: {
        AND: [
          { loyalty_point: { not: null } },
          { coin: { not: null } },
          { 
            NOT: {
              loyalty_point: { equals: prisma.user_accounts.fields.coin }
            }
          }
        ]
      },
      select: {
        user_id: true,
        email: true,
        display_name: true,
        loyalty_point: true,
        coin: true
      },
      take: 10
    });

    if (mismatchedUsers.length === 0) {
      console.log('✅ All users have matching loyalty and coin values (1:1 ratio)');
    } else {
      console.log(`⚠️  Found ${mismatchedUsers.length} users with mismatched loyalty/coin values:`);
      mismatchedUsers.forEach((user, index) => {
        const diff = user.loyalty_point - user.coin;
        console.log(`   ${index + 1}. ${user.display_name || user.email}`);
        console.log(`      Loyalty: ${user.loyalty_point}, Coin: ${user.coin}, Diff: ${diff}`);
      });
    }

  } catch (error) {
    console.error('❌ Status check failed:', error);
  }
}

// Run the tests
if (require.main === module) {
  console.log('🚀 Starting Loyalty-Coin Synchronization Testing Suite\n');
  
  (async () => {
    await checkCurrentSyncStatus();
    console.log('\n' + '='.repeat(60) + '\n');
    await testLoyaltyCoinSync();
  })();
}

module.exports = { testLoyaltyCoinSync, checkCurrentSyncStatus };