/**
 * Loyalty-Coin Sync Test (Updated with correct schema)
 * Test apakah penambahan loyalty otomatis menambahkan coin
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function testLoyaltyCoinSync() {
  console.log('🧪 Testing Loyalty-Coin Synchronization...\n');

  try {
    // 1. Cari member untuk testing
    console.log('🔍 Step 1: Finding test member...');
    
    const testMember = await prisma.members.findFirst({
      where: {
        loyalty_point: { not: null },
        coin: { not: null },
        clerk_id: { not: null }
      },
      select: {
        id: true,
        clerk_id: true,
        nama_lengkap: true,
        loyalty_point: true,
        coin: true
      }
    });

    if (!testMember) {
      console.log('❌ No test member found');
      return false;
    }

    console.log('✅ Test member found:');
    console.log(`   ID: ${testMember.id}`);
    console.log(`   Clerk ID: ${testMember.clerk_id?.substring(0, 8)}...`);
    console.log(`   Name: ${testMember.nama_lengkap || 'N/A'}`);
    console.log(`   Current Loyalty: ${testMember.loyalty_point}`);
    console.log(`   Current Coin: ${testMember.coin}\n`);

    // 2. Record initial values
    const initialLoyalty = parseInt(testMember.loyalty_point) || 0;
    const initialCoin = parseInt(testMember.coin) || 0;
    const testAmount = 500; // Test dengan 500 poin

    console.log('📊 Initial State:');
    console.log(`   Loyalty: ${initialLoyalty}`);
    console.log(`   Coin: ${initialCoin}`);
    console.log(`   Sync Status: ${initialLoyalty === initialCoin ? '✅ SYNCED' : '⚠️ NOT SYNCED'}\n`);

    // 3. Test loyalty update
    console.log(`🧪 Step 2: Adding ${testAmount} loyalty points...`);
    
    await prisma.members.update({
      where: { id: testMember.id },
      data: { loyalty_point: initialLoyalty + testAmount }
    });

    // Wait for potential database triggers
    console.log('⏳ Waiting for database triggers (3 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check result
    const afterUpdate = await prisma.members.findUnique({
      where: { id: testMember.id },
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

    // 4. Test Case 2: Admin-style increment
    console.log('🧪 Step 3: Testing admin-style increment...');
    
    // Reset to original state first
    await prisma.members.update({
      where: { id: testMember.id },
      data: { 
        loyalty_point: initialLoyalty,
        coin: initialCoin
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test with increment operation (like admin interface)
    await prisma.members.update({
      where: { id: testMember.id },
      data: { loyalty_point: { increment: testAmount } }
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const afterIncrement = await prisma.members.findUnique({
      where: { id: testMember.id },
      select: { loyalty_point: true, coin: true }
    });

    const incrementLoyalty = parseInt(afterIncrement.loyalty_point);
    const incrementCoin = parseInt(afterIncrement.coin);

    console.log('📊 Admin increment results:');
    console.log(`   Loyalty: ${initialLoyalty} -> ${incrementLoyalty} (Expected: ${initialLoyalty + testAmount})`);
    console.log(`   Coin: ${initialCoin} -> ${incrementCoin} (Expected: ${initialCoin + testAmount} if sync works)`);

    const adminLoyaltyCorrect = incrementLoyalty === (initialLoyalty + testAmount);
    const adminCoinSynced = incrementCoin === (initialCoin + testAmount);

    console.log(`   ✅ Loyalty Updated: ${adminLoyaltyCorrect ? 'YES' : 'NO'}`);
    console.log(`   ✅ Coin Auto-Synced: ${adminCoinSynced ? 'YES' : 'NO'}\n`);

    // 5. Check database triggers
    console.log('🔍 Step 4: Checking database triggers...');
    try {
      const triggers = await prisma.$queryRaw`
        SELECT 
          trigger_name,
          event_manipulation,
          event_object_table,
          action_timing,
          action_statement
        FROM information_schema.triggers 
        WHERE event_object_table = 'members'
        AND (action_statement ILIKE '%coin%' OR action_statement ILIKE '%loyalty%')
      `;

      if (triggers.length === 0) {
        console.log('❌ No triggers found for loyalty-coin sync');
      } else {
        console.log(`✅ Found ${triggers.length} trigger(s):`);
        triggers.forEach(trigger => {
          console.log(`   - ${trigger.trigger_name} (${trigger.event_manipulation} ${trigger.action_timing})`);
        });
      }
    } catch (error) {
      console.log('⚠️  Could not check triggers:', error.message);
    }

    console.log('');

    // 6. Restore original values
    console.log('🔄 Step 5: Restoring original values...');
    await prisma.members.update({
      where: { id: testMember.id },
      data: { 
        loyalty_point: initialLoyalty,
        coin: initialCoin
      }
    });
    console.log('✅ Original values restored\n');

    // 7. Final diagnosis
    console.log('📋 DIAGNOSIS:');
    console.log('==============');
    
    const syncWorking = coinSynced || adminCoinSynced;
    
    if (syncWorking) {
      console.log('🟢 SUCCESS: Loyalty-Coin sync is working!');
      console.log('   Database triggers/functions are functioning correctly.');
      console.log('   When loyalty is updated, coin is automatically updated.');
      
      if (coinSynced && adminCoinSynced) {
        console.log('   Both direct update and increment operations work.');
      } else if (coinSynced) {
        console.log('   Direct update works, increment might have issues.');
      } else if (adminCoinSynced) {
        console.log('   Increment works, direct update might have issues.');
      }
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

    return syncWorking;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Quick check current sync status
async function checkCurrentSyncStatus() {
  console.log('🔍 Checking Current Sync Status...\n');

  try {
    // Total members with both loyalty and coin
    const totalMembers = await prisma.members.count({
      where: {
        loyalty_point: { not: null },
        coin: { not: null }
      }
    });

    // Members with perfect sync (loyalty === coin)
    const syncedMembers = await prisma.members.count({
      where: {
        loyalty_point: { equals: prisma.members.fields.coin }
      }
    });

    // Sample of mismatched members
    const mismatchedSamples = await prisma.members.findMany({
      where: {
        NOT: { loyalty_point: { equals: prisma.members.fields.coin } }
      },
      select: {
        id: true,
        nama_lengkap: true,
        loyalty_point: true,
        coin: true
      },
      take: 5
    });

    console.log(`📊 Current Sync Status:`);
    console.log(`   Total members with loyalty & coin: ${totalMembers}`);
    console.log(`   Members with perfect sync: ${syncedMembers}`);
    console.log(`   Members with mismatched values: ${totalMembers - syncedMembers}\n`);

    if (totalMembers === syncedMembers) {
      console.log('✅ Perfect sync! All members have matching loyalty and coin values.');
    } else {
      console.log('⚠️  Some members have mismatched loyalty/coin values:');
      console.log('   Sample mismatched members:');
      mismatchedSamples.slice(0, 5).forEach((member, index) => {
        const diff = parseInt(member.loyalty_point) - parseInt(member.coin);
        console.log(`   ${index + 1}. ID ${member.id}: ${member.nama_lengkap || 'N/A'}`);
        console.log(`      Loyalty: ${member.loyalty_point}, Coin: ${member.coin}, Diff: ${diff}`);
      });
    }

    return { totalMembers, syncedMembers, mismatchedCount: totalMembers - syncedMembers };

  } catch (error) {
    console.error('❌ Status check failed:', error.message);
    return null;
  }
}

// Main execution
if (require.main === module) {
  console.log('🚀 Loyalty-Coin Synchronization Test Suite');
  console.log('==========================================\n');

  (async () => {
    const syncStatus = await checkCurrentSyncStatus();
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    const testResult = await testLoyaltyCoinSync();

    console.log('\n' + '='.repeat(60));
    console.log('📋 FINAL SUMMARY:');
    console.log('='.repeat(60));
    
    if (syncStatus) {
      console.log(`Current sync rate: ${syncStatus.syncedMembers}/${syncStatus.totalMembers} members (${((syncStatus.syncedMembers/syncStatus.totalMembers)*100).toFixed(1)}%)`);
    }
    
    console.log(`Loyalty-coin sync working: ${testResult ? '✅ YES' : '❌ NO'}`);
    
    if (!testResult) {
      console.log('\n🔧 ACTION REQUIRED:');
      console.log('   Database triggers for loyalty-coin sync are not working.');
      console.log('   You need to update the admin workflow to manually add coin when adding loyalty.');
      console.log('   Consider restoring the database trigger or implementing manual sync in code.');
    }
  })();
}

module.exports = { testLoyaltyCoinSync, checkCurrentSyncStatus };