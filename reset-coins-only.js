// Simple Production Reset: Hanya reset coin = loyalty_point
// Loyalty point tidak berubah sama sekali

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetCoinsOnly() {
  try {
    console.log('🔄 SIMPLE COIN RESET: Set coin = loyalty_point\n');
    console.log('⚠️ IMPORTANT: Loyalty points will NOT be changed!\n');
    
    // 1. Identify members with coin != loyalty_point
    console.log('📋 1. SCANNING MEMBERS NEEDING RESET:');
    
    const membersToReset = await prisma.$queryRaw`
      SELECT id, nama_lengkap, loyalty_point, coin, 
             (loyalty_point - coin) as coin_deficit
      FROM members 
      WHERE coin != loyalty_point
      ORDER BY (loyalty_point - coin) DESC
    `;
    
    if (membersToReset.length === 0) {
      console.log('   ✅ All members already synced - no reset needed!');
      return;
    }
    
    console.log(`   Found ${membersToReset.length} members needing coin reset:\n`);
    
    membersToReset.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.nama_lengkap}`);
      console.log(`      Before: Loyalty ${member.loyalty_point}, Coin ${member.coin}`);
      console.log(`      Will set: Coin ${member.coin} → ${member.loyalty_point} (+${member.coin_deficit})\n`);
    });
    
    // 2. Calculate total correction
    const totalCoinDeficit = membersToReset.reduce((sum, member) => 
      sum + parseInt(member.coin_deficit), 0
    );
    
    console.log(`📊 CORRECTION SUMMARY:`);
    console.log(`   Members to update: ${membersToReset.length}`);
    console.log(`   Total coins to add: ${totalCoinDeficit}`);
    console.log(`   Largest correction: ${Math.max(...membersToReset.map(m => parseInt(m.coin_deficit)))} coins\n`);
    
    // 3. Execute simple bulk update
    console.log('⚡ 3. EXECUTING COIN RESET:');
    
    // Use simple SQL update - much safer and faster
    const updateResult = await prisma.$executeRaw`
      UPDATE members 
      SET coin = loyalty_point 
      WHERE coin != loyalty_point
    `;
    
    console.log(`   ✅ Updated ${updateResult} members successfully\n`);
    
    // 4. Verify the reset
    console.log('🔍 4. VERIFICATION:');
    
    const afterReset = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_members,
        COUNT(CASE WHEN coin = loyalty_point THEN 1 END) as synced_members,
        COUNT(CASE WHEN coin != loyalty_point THEN 1 END) as still_inconsistent
      FROM members
    `;
    
    const stats = afterReset[0];
    const syncRate = ((parseInt(stats.synced_members) / parseInt(stats.total_members)) * 100).toFixed(1);
    
    console.log(`   Total members: ${stats.total_members}`);
    console.log(`   Synced members: ${stats.synced_members}`);
    console.log(`   Still inconsistent: ${stats.still_inconsistent}`);
    console.log(`   Sync rate: ${syncRate}%\n`);
    
    // 5. Show sample results
    console.log('📋 5. SAMPLE RESULTS (Top 5):');
    
    const sampleResults = await prisma.$queryRaw`
      SELECT nama_lengkap, loyalty_point, coin
      FROM members 
      ORDER BY loyalty_point DESC
      LIMIT 5
    `;
    
    sampleResults.forEach((member, index) => {
      const status = member.coin === member.loyalty_point ? '✅ SYNCED' : '❌ MISMATCH';
      console.log(`   ${index + 1}. ${member.nama_lengkap}: L${member.loyalty_point} C${member.coin} ${status}`);
    });
    
    console.log('\n' + '='.repeat(60));
    
    if (parseInt(stats.still_inconsistent) === 0) {
      console.log('🎉 COIN RESET SUCCESSFUL!');
      console.log('✅ All coins now match loyalty_points');
      console.log('✅ Loyalty points unchanged (preserved)'); 
      console.log('✅ Fresh start for dual-currency system');
      console.log('✅ Ready for legitimate redemptions! 🚀');
    } else {
      console.log('⚠️ PARTIAL SUCCESS');
      console.log(`${stats.still_inconsistent} members still need attention`);
    }
    
  } catch (error) {
    console.error('❌ Coin reset failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetCoinsOnly();
