// Simulasi real-world scenario: User menyelesaikan task
// Test apakah trigger auto-sync bekerja dengan benar

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulateTaskCompletion() {
  try {
    console.log('🎯 SIMULASI: User menyelesaikan task...\n');
    
    // 1. Pilih member untuk test
    const testMember = await prisma.members.findFirst({
      where: { nama_lengkap: { not: null } },
      orderBy: { loyalty_point: 'desc' }
    });
    
    console.log(`👤 Testing with: ${testMember.nama_lengkap}`);
    console.log(`📊 Before - Loyalty: ${testMember.loyalty_point}, Coin: ${testMember.coin}\n`);
    
    // 2. Simulate task completion (menambah loyalty_point_history)
    console.log('⚡ Adding loyalty points (simulating task completion)...');
    const loyaltyHistory = await prisma.loyalty_point_history.create({
      data: {
        member_id: testMember.id,
        point: 10,
        event: 'Penyelesaian Tugas - Instagram Comment',
        event_type: 'task_completion'
      }
    });
    
    console.log(`✅ Loyalty history created: +${loyaltyHistory.point} points`);
    
    // 3. Check if coin auto-synced
    const updatedMember = await prisma.members.findUnique({
      where: { id: testMember.id }
    });
    
    console.log(`📊 After  - Loyalty: ${updatedMember.loyalty_point}, Coin: ${updatedMember.coin}`);
    
    // 4. Verify sync worked correctly
    const loyaltyIncrease = updatedMember.loyalty_point - testMember.loyalty_point;
    const coinIncrease = updatedMember.coin - testMember.coin;
    
    console.log(`📈 Changes - Loyalty: +${loyaltyIncrease}, Coin: +${coinIncrease}\n`);
    
    if (loyaltyIncrease === 10 && coinIncrease === 10) {
      console.log('🎉 SUCCESS: Auto-sync working perfectly!');
      console.log('   ✅ Loyalty increased by 10');
      console.log('   ✅ Coin auto-synced (+10)');
      console.log('   ✅ Both balances remain equal\n');
    } else {
      console.log('❌ SYNC ISSUE DETECTED!');
      console.log(`   Expected: +10 for both loyalty and coin`);
      console.log(`   Actual: Loyalty +${loyaltyIncrease}, Coin +${coinIncrease}\n`);
    }
    
    // 5. Check transaction log entry
    console.log('📋 TRANSACTION LOG VERIFICATION:');
    const logEntry = await prisma.$queryRaw`
      SELECT mt.*, tt.name as transaction_type
      FROM member_transactions mt
      JOIN transaction_types tt ON mt.transaction_type_id = tt.id
      WHERE mt.member_id = ${testMember.id}
      ORDER BY mt.created_at DESC
      LIMIT 1
    `;
    
    if (logEntry.length > 0) {
      const log = logEntry[0];
      console.log(`✅ Transaction logged: ${log.transaction_type}`);
      console.log(`   Loyalty amount: +${log.loyalty_amount}`);
      console.log(`   Coin amount: +${log.coin_amount}`);
      console.log(`   Reference: ${log.reference_table}#${log.reference_id}\n`);
    } else {
      console.log('❌ No transaction log found\n');
    }
    
    // 6. Final consistency check
    console.log('🔍 FINAL CONSISTENCY CHECK:');
    const finalCheck = await prisma.members.findUnique({
      where: { id: testMember.id }
    });
    
    if (finalCheck.loyalty_point === finalCheck.coin) {
      console.log('✅ PERFECT: loyalty_point === coin');
      console.log(`   Both balances: ${finalCheck.loyalty_point}`);
    } else {
      console.log('❌ INCONSISTENCY DETECTED!');
      console.log(`   Loyalty: ${finalCheck.loyalty_point}, Coin: ${finalCheck.coin}`);
    }
    
  } catch (error) {
    console.error('❌ Simulation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateTaskCompletion();
