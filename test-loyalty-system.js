// Test script untuk mengecek sistem loyalty point
// Jalankan: node test-loyalty-system.js

import prisma from './lib/prisma.js';

async function testLoyaltySystem() {
  try {
    console.log('🧪 TESTING LOYALTY POINT SYSTEM...\n');
    
    // 1. Test: Cari member untuk testing
    console.log('🔍 1. MENCARI MEMBER UNTUK TESTING:');
    const testMember = await prisma.members.findFirst({
      where: { 
        loyalty_point: { gt: 0 },  // Member yang sudah ada points
        AND: {
          loyalty_point: { lt: 1000 }  // Tidak terlalu banyak points
        }
      },
      orderBy: { loyalty_point: 'desc' }
    });
    
    if (!testMember) {
      console.log('❌ Tidak ada member yang cocok untuk testing');
      return;
    }
    
    console.log(`✅ Testing dengan: ${testMember.nama_lengkap}`);
    console.log(`   Before - Loyalty: ${testMember.loyalty_point}, Coin: ${testMember.coin}\n`);
    
    // 2. Test: Simulasi penambahan poin melalui loyalty_point_history
    console.log('📈 2. SIMULASI PENAMBAHAN POIN:');
    const beforeState = {
      loyalty: testMember.loyalty_point,
      coin: testMember.coin
    };
    
    // Insert ke loyalty_point_history (simulasi N8N workflow)
    const historyResult = await prisma.loyalty_point_history.create({
      data: {
        member_id: testMember.id,
        point: 5,
        event: 'TEST: Weekend Event Simulation',
        event_type: 'test'
      }
    });
    
    console.log(`✅ Loyalty history created: +${historyResult.point} points`);
    
    // 3. Cek apakah ada auto-sync (trigger database)
    console.log('\n🔄 3. CEK AUTO-SYNC TRIGGER:');
    const afterMember = await prisma.members.findUnique({
      where: { id: testMember.id }
    });
    
    const loyaltyIncrease = afterMember.loyalty_point - beforeState.loyalty;
    const coinIncrease = afterMember.coin - beforeState.coin;
    
    console.log(`📊 After  - Loyalty: ${afterMember.loyalty_point}, Coin: ${afterMember.coin}`);
    console.log(`📈 Changes - Loyalty: +${loyaltyIncrease}, Coin: +${coinIncrease}`);
    
    // 4. Analisis hasil
    console.log('\n📋 4. ANALISIS HASIL:');
    if (loyaltyIncrease === 5 && coinIncrease === 5) {
      console.log('✅ DATABASE TRIGGER AKTIF: Auto-sync loyalty → coin');
      console.log('   ⚠️  PERHATIAN: Jangan gunakan N8N coin-sync workflow!');
      console.log('   💡 REKOMENDASI: Gunakan N8N VALIDASI TUGAS saja');
    } else if (loyaltyIncrease === 0 && coinIncrease === 0) {
      console.log('❌ SISTEM TIDAK BERFUNGSI: Tidak ada perubahan');
      console.log('   🚨 BUG: loyalty_point_history tidak mempengaruhi members table');
    } else if (loyaltyIncrease === 5 && coinIncrease === 0) {
      console.log('⚠️  TRIGGER TIDAK ADA: Manual update diperlukan');
      console.log('   💡 REKOMENDASI: Gunakan CoinLoyaltyManager.js untuk sync');
    } else {
      console.log('🤔 HASIL TIDAK EXPECTED:');
      console.log(`   Loyalty: expected +5, got +${loyaltyIncrease}`);
      console.log(`   Coin: expected +5, got +${coinIncrease}`);
    }
    
    // 5. Cek konsistensi database
    console.log('\n🛡️  5. CEK KONSISTENSI DATABASE:');
    const inconsistentMembers = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM members 
      WHERE loyalty_point != coin
    `;
    
    console.log(`Found ${inconsistentMembers[0].count} members with loyalty_point ≠ coin`);
    
    if (inconsistentMembers[0].count > 0) {
      console.log('⚠️  ADA INKONSISTENSI: Beberapa member coin ≠ loyalty_point');
      
      const examples = await prisma.$queryRaw`
        SELECT nama_lengkap, loyalty_point, coin, (loyalty_point - coin) as difference
        FROM members 
        WHERE loyalty_point != coin
        ORDER BY ABS(loyalty_point - coin) DESC
        LIMIT 3
      `;
      
      console.log('📋 Contoh inkonsistensi:');
      examples.forEach(member => {
        console.log(`   ${member.nama_lengkap}: L${member.loyalty_point} C${member.coin} (diff: ${member.difference})`);
      });
    } else {
      console.log('✅ KONSISTEN: Semua member coin = loyalty_point');
    }
    
    // 6. Rollback test data
    console.log('\n🔄 6. ROLLBACK TEST DATA:');
    await prisma.loyalty_point_history.delete({
      where: { id: historyResult.id }
    });
    
    // Reset member data
    await prisma.members.update({
      where: { id: testMember.id },
      data: {
        loyalty_point: beforeState.loyalty,
        coin: beforeState.coin
      }
    });
    
    console.log('✅ Test data berhasil di-rollback');
    
    console.log('\n🎉 LOYALTY SYSTEM TEST COMPLETED!');
    console.log('📋 Lihat hasil analisis di atas untuk menentukan strategi weekend event');
    
  } catch (error) {
    console.error('❌ Error during loyalty system test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Jalankan test
testLoyaltySystem();
