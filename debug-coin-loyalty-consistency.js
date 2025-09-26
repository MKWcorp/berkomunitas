// Script untuk mengecek inkonsistensi coin vs loyalty_point
// Jalankan ini untuk melihat data yang bermasalah

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCoinLoyaltyConsistency() {
  try {
    console.log('🔍 Mengecek konsistensi coin vs loyalty_point...\n');

    // 1. Ambil semua member untuk dicek manual
    const allMembers = await prisma.members.findMany({
      select: {
        id: true,
        nama_lengkap: true,
        loyalty_point: true,
        coin: true,
        tanggal_daftar: true
      },
      orderBy: { id: 'asc' }
    });

    // 2. Filter yang tidak konsisten
    const inconsistentMembers = allMembers.filter(member => 
      member.coin !== member.loyalty_point
    );

    console.log(`❌ Ditemukan ${inconsistentMembers.length} member dengan inkonsistensi:\n`);
    
    inconsistentMembers.forEach(member => {
      const diff = member.loyalty_point - member.coin;
      console.log(`ID: ${member.id} | ${member.nama_lengkap || 'No name'}`);
      console.log(`   Loyalty: ${member.loyalty_point} | Coin: ${member.coin} | Diff: ${diff > 0 ? '+' + diff : diff}`);
      console.log(`   Created: ${member.tanggal_daftar?.toISOString().split('T')[0] || 'No date'}\n`);
    });

    // 2. Summary statistics
    const totalMembers = allMembers.length;
    const syncedCount = totalMembers - inconsistentMembers.length;

    console.log('📊 SUMMARY:');
    console.log(`Total Members: ${totalMembers}`);
    console.log(`Synced: ${syncedCount} ✅`);
    console.log(`Inconsistent: ${inconsistentMembers.length} ❌`);
    console.log(`Sync Rate: ${((syncedCount / totalMembers) * 100).toFixed(1)}%\n`);

    // 3. Analisis pola inkonsistensi
    if (inconsistentMembers.length > 0) {
      const patterns = {};
      inconsistentMembers.forEach(member => {
        const diff = member.loyalty_point - member.coin;
        patterns[diff] = (patterns[diff] || 0) + 1;
      });

      console.log('🔍 POLA INKONSISTENSI:');
      Object.entries(patterns).forEach(([diff, count]) => {
        console.log(`   Selisih ${diff > 0 ? '+' + diff : diff}: ${count} member(s)`);
      });
    }

    // 4. Cek history point terbaru
    console.log('\n📋 5 HISTORY POINT TERBARU:');
    const recentHistory = await prisma.loyalty_point_history.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        members: {
          select: {
            nama_lengkap: true,
            loyalty_point: true,
            coin: true
          }
        }
      }
    });

    recentHistory.forEach(h => {
      const member = h.members;
      console.log(`${h.created_at.toISOString().split('T')[0]} | ${h.event} | +${h.point} pts`);
      console.log(`   ${member.nama_lengkap || 'No name'} | L:${member.loyalty_point} C:${member.coin}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCoinLoyaltyConsistency();
