// Script untuk melihat detail member dengan poin tertinggi
// untuk memastikan tidak ada inkonsistensi di level user dengan aktivitas tinggi

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTopMembers() {
  try {
    console.log('🏆 Mengecek member dengan poin tertinggi...\n');

    // 1. Top 10 member berdasarkan loyalty_point
    const topMembers = await prisma.members.findMany({
      select: {
        id: true,
        nama_lengkap: true,
        loyalty_point: true,
        coin: true,
        tanggal_daftar: true
      },
      orderBy: { loyalty_point: 'desc' },
      take: 10
    });

    console.log('🏆 TOP 10 MEMBERS BY LOYALTY POINTS:');
    topMembers.forEach((member, index) => {
      const status = member.coin === member.loyalty_point ? '✅' : '❌';
      console.log(`${index + 1}. ${member.nama_lengkap || 'No name'} (ID: ${member.id})`);
      console.log(`   Loyalty: ${member.loyalty_point} | Coin: ${member.coin} ${status}`);
      console.log(`   Registered: ${member.tanggal_daftar?.toISOString().split('T')[0] || 'No date'}\n`);
    });

    // 2. Cek jika ada member dengan redemption history
    console.log('💰 CHECKING REDEMPTION HISTORY:');
    const redemptions = await prisma.reward_redemptions.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            loyalty_point: true,
            coin: true
          }
        },
        rewards: {
          select: {
            reward_name: true,
            cost: true
          }
        }
      }
    });

    if (redemptions.length > 0) {
      redemptions.forEach(redemption => {
        const member = redemption.members;
        console.log(`${redemption.created_at.toISOString().split('T')[0]} | ${redemption.rewards.reward_name} (${redemption.rewards.cost} coins)`);
        console.log(`   ${member.nama_lengkap} | L:${member.loyalty_point} C:${member.coin}`);
        console.log(`   Expected: Loyalty unchanged, Coin reduced by ${redemption.rewards.cost}\n`);
      });
    } else {
      console.log('   Tidak ada redemption history ditemukan ✅\n');
    }

    // 3. Cek transaksi loyalty_point_history terbaru
    console.log('📊 RECENT LOYALTY POINT TRANSACTIONS:');
    const recentTransactions = await prisma.loyalty_point_history.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            loyalty_point: true,
            coin: true
          }
        }
      }
    });

    recentTransactions.forEach(tx => {
      const member = tx.members;
      const status = member.coin === member.loyalty_point ? '✅' : '❌';
      console.log(`${tx.created_at.toISOString().split('T')[0]} | ${tx.event} | +${tx.point} pts`);
      console.log(`   ${member.nama_lengkap} | L:${member.loyalty_point} C:${member.coin} ${status}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTopMembers();
