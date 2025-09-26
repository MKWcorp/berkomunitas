// Testing script untuk validasi sistem coin-loyalty sync
// Jalankan setelah migration untuk ensure everything works

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCoinLoyaltySync() {
  console.log('🧪 Testing Coin-Loyalty Sync System...\n');
  
  try {
    // 1. Test existing data consistency
    console.log('📊 CHECKING EXISTING DATA CONSISTENCY:');
    const inconsistentMembers = await prisma.$queryRaw`
      SELECT id, nama_lengkap, loyalty_point, coin, 
             (loyalty_point - coin) as difference
      FROM members 
      WHERE loyalty_point != coin
      ORDER BY difference DESC
    `;
    
    if (inconsistentMembers.length > 0) {
      console.log(`❌ Found ${inconsistentMembers.length} inconsistent members:`);
      inconsistentMembers.forEach(m => {
        console.log(`   ${m.nama_lengkap}: L${m.loyalty_point} C${m.coin} (diff: ${m.difference})`);
      });
    } else {
      console.log('✅ All members are consistent\n');
    }
    
    // 2. Test trigger: Add loyalty points (should auto-sync coin)
    console.log('🔄 TESTING AUTO-SYNC TRIGGER:');
    const testMember = await prisma.members.findFirst({
      orderBy: { id: 'asc' }
    });
    
    if (testMember) {
      const beforeState = {
        loyalty: testMember.loyalty_point,
        coin: testMember.coin
      };
      
      console.log(`Testing with member: ${testMember.nama_lengkap}`);
      console.log(`Before - Loyalty: ${beforeState.loyalty}, Coin: ${beforeState.coin}`);
      
      // Add loyalty points (should trigger coin sync)
      await prisma.loyalty_point_history.create({
        data: {
          member_id: testMember.id,
          point: 5,
          event: 'TEST: Sync Validation',
          event_type: 'test'
        }
      });
      
      // Check after state
      const afterMember = await prisma.members.findUnique({
        where: { id: testMember.id }
      });
      
      console.log(`After  - Loyalty: ${afterMember.loyalty_point}, Coin: ${afterMember.coin}`);
      
      const loyaltyDiff = afterMember.loyalty_point - beforeState.loyalty;
      const coinDiff = afterMember.coin - beforeState.coin;
      
      if (loyaltyDiff === 5 && coinDiff === 5) {
        console.log('✅ AUTO-SYNC WORKING: Both loyalty and coin increased by 5\n');
      } else {
        console.log(`❌ AUTO-SYNC FAILED: Loyalty +${loyaltyDiff}, Coin +${coinDiff}\n`);
      }
    }
    
    // 3. Check transaction log
    console.log('📋 CHECKING TRANSACTION LOG:');
    const recentTransactions = await prisma.$queryRaw`
      SELECT mt.*, tt.name as transaction_type, m.nama_lengkap
      FROM member_transactions mt
      JOIN transaction_types tt ON mt.transaction_type_id = tt.id
      JOIN members m ON mt.member_id = m.id
      ORDER BY mt.created_at DESC
      LIMIT 5
    `;
    
    if (recentTransactions.length > 0) {
      console.log('Recent transactions:');
      recentTransactions.forEach(tx => {
        console.log(`   ${tx.nama_lengkap}: ${tx.transaction_type} L${tx.loyalty_amount > 0 ? '+' : ''}${tx.loyalty_amount} C${tx.coin_amount > 0 ? '+' : ''}${tx.coin_amount}`);
      });
    } else {
      console.log('No transactions found in log');
    }
    
    // 4. Test validation trigger
    console.log('\n🛡️ TESTING VALIDATION TRIGGERS:');
    try {
      await prisma.$executeRaw`
        UPDATE members 
        SET coin = loyalty_point + 100 
        WHERE id = ${testMember.id}
      `;
      console.log('❌ VALIDATION FAILED: Should prevent coin > loyalty_point');
    } catch (error) {
      if (error.message.includes('cannot exceed loyalty_point')) {
        console.log('✅ VALIDATION WORKING: Prevented coin > loyalty_point');
      } else {
        console.log('❓ Unexpected error:', error.message);
      }
    }
    
    // 5. Overall system health
    console.log('\n📈 SYSTEM HEALTH SUMMARY:');
    const totalMembers = await prisma.members.count();
    const syncedMembers = await prisma.members.count({
      where: { coin: { equals: prisma.members.fields.loyalty_point } }
    });
    const syncRate = ((syncedMembers / totalMembers) * 100).toFixed(1);
    
    console.log(`Total Members: ${totalMembers}`);
    console.log(`Synced Members: ${syncedMembers}`);
    console.log(`Sync Rate: ${syncRate}%`);
    
    if (syncRate >= 99) {
      console.log('🎉 SYSTEM STATUS: EXCELLENT');
    } else if (syncRate >= 95) {
      console.log('✅ SYSTEM STATUS: GOOD');
    } else {
      console.log('⚠️ SYSTEM STATUS: NEEDS ATTENTION');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCoinLoyaltySync();
