// Test redemption scenario: coin berkurang, loyalty tetap
// Simulasi user menukar hadiah

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulateRedemption() {
  try {
    console.log('💰 SIMULASI: User menukar hadiah (redemption)...\n');
    
    // 1. Cek apakah ada rewards yang tersedia
    const rewards = await prisma.rewards.findMany({
      where: { point_cost: { lte: 100 } }, // rewards yang murah untuk test
      take: 1
    });
    
    if (rewards.length === 0) {
      console.log('⚠️ No rewards found for testing. Creating test reward...');
      const testReward = await prisma.rewards.create({
        data: {
          reward_name: 'TEST Reward - Sticker Pack',
          point_cost: 50,
          description: 'Test reward for validation'
        }
      });
      rewards.push(testReward);
    }
    
    const reward = rewards[0];
    console.log(`🎁 Test reward: ${reward.reward_name} (Cost: ${reward.point_cost} coins)`);
    
    // 2. Pilih member dengan coin yang cukup
    const testMember = await prisma.members.findFirst({
      where: { coin: { gte: reward.point_cost } },
      orderBy: { coin: 'desc' }
    });
    
    if (!testMember) {
      console.log('❌ No member with enough coins for redemption test');
      return;
    }
    
    console.log(`👤 Testing with: ${testMember.nama_lengkap}`);
    console.log(`📊 Before - Loyalty: ${testMember.loyalty_point}, Coin: ${testMember.coin}\n`);
    
    // 3. Perform manual coin deduction (simulating redemption)
    console.log('⚡ Processing redemption...');
    
    // First, deduct coin manually
    await prisma.members.update({
      where: { id: testMember.id },
      data: { coin: { decrement: reward.point_cost } }
    });
    
    // Then create redemption record (trigger will log this)
    const redemption = await prisma.reward_redemptions.create({
      data: {
        id_member: testMember.id,
        id_reward: reward.id,
        points_spent: reward.point_cost,
        status: 'completed'
      }
    });
    
    console.log(`✅ Redemption processed: ID ${redemption.id}`);
    
    // 4. Check result
    const updatedMember = await prisma.members.findUnique({
      where: { id: testMember.id }
    });
    
    console.log(`📊 After  - Loyalty: ${updatedMember.loyalty_point}, Coin: ${updatedMember.coin}`);
    
    // 5. Verify redemption logic
    const loyaltyChange = updatedMember.loyalty_point - testMember.loyalty_point;
    const coinChange = testMember.coin - updatedMember.coin; // positive = decrease
    
    console.log(`📈 Changes - Loyalty: ${loyaltyChange > 0 ? '+' : ''}${loyaltyChange}, Coin: -${coinChange}\n`);
    
    if (loyaltyChange === 0 && coinChange === reward.point_cost) {
      console.log('🎉 REDEMPTION SUCCESS:');
      console.log('   ✅ Loyalty unchanged (permanent record)');
      console.log(`   ✅ Coin reduced by ${reward.point_cost} (spendable currency)`);
      console.log('   ✅ Dual-currency system working correctly!\n');
    } else {
      console.log('❌ REDEMPTION ISSUE:');
      console.log(`   Expected: Loyalty unchanged, Coin -${reward.point_cost}`);
      console.log(`   Actual: Loyalty ${loyaltyChange}, Coin -${coinChange}\n`);
    }
    
    // 6. Check transaction log
    console.log('📋 REDEMPTION LOG VERIFICATION:');
    const logEntry = await prisma.$queryRaw`
      SELECT mt.*, tt.name as transaction_type
      FROM member_transactions mt
      JOIN transaction_types tt ON mt.transaction_type_id = tt.id
      WHERE mt.member_id = ${testMember.id}
      AND mt.reference_table = 'reward_redemptions'
      ORDER BY mt.created_at DESC
      LIMIT 1
    `;
    
    if (logEntry.length > 0) {
      const log = logEntry[0];
      console.log(`✅ Redemption logged: ${log.transaction_type}`);
      console.log(`   Loyalty amount: ${log.loyalty_amount} (unchanged)`);
      console.log(`   Coin amount: ${log.coin_amount} (deducted)`);
      console.log(`   Balance after: L${log.loyalty_balance_after} C${log.coin_balance_after}\n`);
    } else {
      console.log('❌ No redemption log found\n');
    }
    
    // 7. Final system integrity check
    console.log('🔍 SYSTEM INTEGRITY CHECK:');
    if (updatedMember.coin <= updatedMember.loyalty_point) {
      console.log('✅ INTEGRITY MAINTAINED: coin ≤ loyalty_point');
      console.log(`   Loyalty: ${updatedMember.loyalty_point} (permanent)`);
      console.log(`   Coin: ${updatedMember.coin} (spendable)`);
      console.log(`   Available for spending: ${updatedMember.coin} coins`);
    } else {
      console.log('❌ INTEGRITY VIOLATION: coin > loyalty_point');
    }
    
  } catch (error) {
    console.error('❌ Redemption test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateRedemption();
