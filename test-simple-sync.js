/**
 * Simple Loyalty-Coin Sync Test
 * Test sederhana untuk memeriksa apakah loyalty dan coin masih sinkron
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function simpleTest() {
  console.log('🧪 Simple Loyalty-Coin Sync Test\n');

  try {
    // 1. Ambil member untuk testing
    console.log('🔍 Finding test member...');
    
    const testMember = await prisma.members.findFirst({
      select: {
        id: true,
        nama_lengkap: true,
        loyalty_point: true,
        coin: true
      }
    });

    if (!testMember) {
      console.log('❌ No members found');
      return;
    }

    console.log('✅ Test member:');
    console.log(`   ID: ${testMember.id}`);
    console.log(`   Name: ${testMember.nama_lengkap || 'N/A'}`);
    console.log(`   Loyalty: ${testMember.loyalty_point}`);
    console.log(`   Coin: ${testMember.coin}\n`);

    // 2. Record initial values
    const initialLoyalty = parseInt(testMember.loyalty_point) || 0;
    const initialCoin = parseInt(testMember.coin) || 0;
    const testAmount = 100;

    console.log(`📊 Initial values: Loyalty=${initialLoyalty}, Coin=${initialCoin}`);
    console.log(`🧪 Testing: Adding ${testAmount} loyalty points...\n`);

    // 3. Update loyalty
    await prisma.members.update({
      where: { id: testMember.id },
      data: { loyalty_point: initialLoyalty + testAmount }
    });

    console.log('⏳ Waiting 5 seconds for potential database triggers...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. Check results
    const updated = await prisma.members.findUnique({
      where: { id: testMember.id },
      select: { loyalty_point: true, coin: true }
    });

    const newLoyalty = parseInt(updated.loyalty_point);
    const newCoin = parseInt(updated.coin);

    console.log('📊 Results:');
    console.log(`   Loyalty: ${initialLoyalty} -> ${newLoyalty}`);
    console.log(`   Coin: ${initialCoin} -> ${newCoin}`);

    const loyaltyUpdated = newLoyalty === (initialLoyalty + testAmount);
    const coinSynced = newCoin === (initialCoin + testAmount);

    console.log(`   ✅ Loyalty correctly updated: ${loyaltyUpdated ? 'YES' : 'NO'}`);
    console.log(`   ✅ Coin automatically synced: ${coinSynced ? 'YES' : 'NO'}\n`);

    // 5. Restore original values
    console.log('🔄 Restoring original values...');
    await prisma.members.update({
      where: { id: testMember.id },
      data: { 
        loyalty_point: initialLoyalty,
        coin: initialCoin
      }
    });

    console.log('✅ Original values restored\n');

    // 6. Final result
    console.log('📋 TEST RESULT:');
    console.log('===============');
    
    if (coinSynced) {
      console.log('🟢 SUCCESS: Loyalty-Coin sync is WORKING!');
      console.log('   Database triggers are functioning correctly.');
      console.log('   When admin adds loyalty, coin will be added automatically.');
    } else {
      console.log('🔴 ISSUE: Loyalty-Coin sync is NOT WORKING!');
      console.log('   Database triggers are missing or broken.');
      console.log('   When admin adds loyalty, coin will NOT be added automatically.');
      console.log('   ⚠️  WORKFLOW UPDATE REQUIRED');
    }

    return coinSynced;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Test current data sync status
async function checkDataSync() {
  console.log('🔍 Checking current data sync status...\n');

  try {
    // Get sample of members
    const members = await prisma.members.findMany({
      select: {
        id: true,
        nama_lengkap: true,
        loyalty_point: true,
        coin: true
      },
      take: 10
    });

    console.log('📊 Sample members sync status:');
    console.log('-'.repeat(50));
    
    let syncedCount = 0;
    let totalCount = 0;

    members.forEach((member, index) => {
      const loyalty = parseInt(member.loyalty_point) || 0;
      const coin = parseInt(member.coin) || 0;
      const synced = loyalty === coin;
      
      if (synced) syncedCount++;
      totalCount++;
      
      console.log(`${index + 1}. ID ${member.id}: ${member.nama_lengkap || 'N/A'}`);
      console.log(`   Loyalty: ${loyalty}, Coin: ${coin} ${synced ? '✅' : '❌'}`);
    });

    const syncRate = (syncedCount / totalCount * 100).toFixed(1);
    
    console.log('-'.repeat(50));
    console.log(`📈 Sync Rate: ${syncedCount}/${totalCount} (${syncRate}%)\n`);

    if (syncRate === '100.0') {
      console.log('✅ Perfect sync! All sampled members have matching loyalty/coin.');
    } else {
      console.log(`⚠️  ${totalCount - syncedCount} members have mismatched loyalty/coin values.`);
      console.log('   This might indicate past sync issues or manual adjustments.');
    }

  } catch (error) {
    console.error('❌ Data sync check failed:', error);
  }
}

// Main execution
if (require.main === module) {
  console.log('🚀 Loyalty-Coin Synchronization Testing\n');
  
  (async () => {
    await checkDataSync();
    console.log('\n' + '='.repeat(60) + '\n');
    
    const testResult = await simpleTest();
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 CONCLUSION:');
    console.log('='.repeat(60));
    
    if (testResult) {
      console.log('✅ Database triggers are working correctly.');
      console.log('   Admin can add loyalty and coin will be added automatically.');
      console.log('   No workflow changes needed.');
    } else {
      console.log('❌ Database triggers are NOT working.');
      console.log('   Admin adding loyalty will NOT automatically add coin.');
      console.log('   🔧 WORKFLOW UPDATE REQUIRED:');
      console.log('   - Update admin interface to manually add coin when adding loyalty');
      console.log('   - Or restore database trigger for automatic sync');
    }

    await prisma.$disconnect();
  })();
}

module.exports = { simpleTest, checkDataSync };