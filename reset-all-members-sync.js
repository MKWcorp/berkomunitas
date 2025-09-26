// Production Reset: Sync semua member coins dengan loyalty_point
// Karena belum ada redemption yang valid, semua deficit adalah bug

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetAllMembersToSync() {
  try {
    console.log('🔄 PRODUCTION RESET: Syncing All Members\n');
    console.log('Menyamakan coin dengan loyalty_point untuk semua member...\n');
    
    // 1. Backup current state untuk safety
    console.log('💾 1. CREATING BACKUP SNAPSHOT:');
    const beforeState = await prisma.members.findMany({
      where: { 
        coin: { not: { equals: prisma.members.fields.loyalty_point } }
      },
      select: { id: true, nama_lengkap: true, loyalty_point: true, coin: true }
    });
    
    if (beforeState.length > 0) {
      console.log(`   Found ${beforeState.length} members needing reset:`);
      beforeState.forEach(member => {
        const deficit = member.loyalty_point - member.coin;
        console.log(`   - ${member.nama_lengkap}: L${member.loyalty_point} C${member.coin} (deficit: ${deficit})`);
      });
      
      console.log(`\n   Backup created for ${beforeState.length} members\n`);
    } else {
      console.log('   No members need reset - all already synced!\n');
      return;
    }
    
    // 2. Calculate total correction needed
    console.log('📊 2. CORRECTION ANALYSIS:');
    const totalDeficit = beforeState.reduce((sum, member) => 
      sum + (member.loyalty_point - member.coin), 0
    );
    console.log(`   Total coins to be added: ${totalDeficit}`);
    console.log(`   Average correction per member: ${Math.round(totalDeficit / beforeState.length)}\n`);
    
    // 3. Perform reset via transaction
    console.log('⚡ 3. EXECUTING RESET:');
    
    const resetResults = await prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const member of beforeState) {
        // Update coin to match loyalty_point
        const updated = await tx.members.update({
          where: { id: member.id },
          data: { coin: member.loyalty_point }
        });
        
        // Log the correction in transaction history
        const transactionType = await tx.transaction_types.findFirst({
          where: { type_code: 'admin_correction' }
        });
        
        const coinCorrection = member.loyalty_point - member.coin;
        
        if (coinCorrection > 0 && transactionType) {
          await tx.member_transactions.create({
            data: {
              member_id: member.id,
              transaction_type_id: transactionType.id,
              loyalty_amount: 0, // no change to loyalty
              coin_amount: coinCorrection, // correction amount
              description: 'Production Reset - Sync coin with loyalty_point',
              reference_table: 'manual_correction',
              reference_id: null,
              loyalty_balance_before: member.loyalty_point,
              loyalty_balance_after: member.loyalty_point,
              coin_balance_before: member.coin,
              coin_balance_after: member.loyalty_point
            }
          });
        }
        
        results.push({
          id: member.id,
          nama_lengkap: member.nama_lengkap,
          before: { loyalty: member.loyalty_point, coin: member.coin },
          after: { loyalty: updated.loyalty_point, coin: updated.coin },
          correction: coinCorrection
        });
        
        console.log(`   ✅ ${member.nama_lengkap}: C${member.coin} → C${updated.coin} (+${coinCorrection})`);
      }
      
      return results;
    });
    
    console.log(`\n   Reset completed for ${resetResults.length} members\n`);
    
    // 4. Verify reset success
    console.log('🔍 4. VERIFICATION:');
    const afterReset = await prisma.members.count({
      where: { 
        coin: { not: { equals: prisma.members.fields.loyalty_point } }
      }
    });
    
    const totalMembers = await prisma.members.count();
    const syncedMembers = totalMembers - afterReset;
    
    console.log(`   Total members: ${totalMembers}`);
    console.log(`   Synced members: ${syncedMembers}`);
    console.log(`   Remaining inconsistent: ${afterReset}`);
    console.log(`   Sync rate: ${((syncedMembers/totalMembers)*100).toFixed(1)}%`);
    
    if (afterReset === 0) {
      console.log('   🎉 PERFECT: All members are now synced!\n');
    } else {
      console.log('   ⚠️ Some members still inconsistent - needs investigation\n');
    }
    
    // 5. Summary report
    console.log('📋 5. RESET SUMMARY REPORT:');
    const totalCorrectionMade = resetResults.reduce((sum, r) => sum + r.correction, 0);
    
    console.log(`   Members corrected: ${resetResults.length}`);
    console.log(`   Total coins added: ${totalCorrectionMade}`);
    console.log(`   Largest correction: ${Math.max(...resetResults.map(r => r.correction))} coins`);
    
    // Top corrections
    const topCorrections = resetResults
      .sort((a, b) => b.correction - a.correction)
      .slice(0, 5);
      
    console.log('\n   Top 5 corrections:');
    topCorrections.forEach((r, index) => {
      console.log(`   ${index + 1}. ${r.nama_lengkap}: +${r.correction} coins`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 PRODUCTION RESET COMPLETE!');
    console.log('✅ All members now have coin = loyalty_point');
    console.log('✅ Fresh start for dual-currency system');
    console.log('✅ All corrections logged in transaction history');
    console.log('✅ Ready for clean redemption tracking! 🚀');
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
    console.log('\n🚨 ROLLBACK RECOMMENDED - Check data integrity!');
  } finally {
    await prisma.$disconnect();
  }
}

resetAllMembersToSync();
