const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function countDrwCorpBadgeHolders() {
  try {
    console.log('🔍 Mencari badge DRW Corp...');

    // Find DRW Corp badge
    const drwCorpBadge = await prisma.badges.findFirst({
      where: { badge_name: 'DRW Corp' }
    });

    if (!drwCorpBadge) {
      console.log('❌ DRW Corp badge tidak ditemukan di database');
      return;
    }

    console.log('✅ Badge DRW Corp ditemukan:');
    console.log('   ID:', drwCorpBadge.id);
    console.log('   Nama:', drwCorpBadge.badge_name);
    console.log('   Deskripsi:', drwCorpBadge.description || 'Tidak ada deskripsi');

    // Count members with DRW Corp badge
    const badgeCount = await prisma.member_badges.count({
      where: { id_badge: drwCorpBadge.id }
    });

    console.log('\n🏆 HASIL PERHITUNGAN:');
    console.log('================================');
    console.log('👥 Jumlah Member dengan Badge DRW Corp:', badgeCount);
    console.log('================================');

    // Get detailed list if count is reasonable
    if (badgeCount > 0 && badgeCount <= 100) {
      console.log('\n📋 Detail Member dengan Badge DRW Corp:');

      const membersWithBadge = await prisma.member_badges.findMany({
        where: { id_badge: drwCorpBadge.id },
        include: {
          members: {
            select: {
              id: true,
              nama_lengkap: true,
              loyalty_point: true
            }
          }
        },
        orderBy: {
          members: {
            loyalty_point: 'desc'
          }
        }
      });

      membersWithBadge.forEach((item, index) => {
        const member = item.members;
        console.log(`${index + 1}. ${member.nama_lengkap} - ${member.loyalty_point} points`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

countDrwCorpBadgeHolders();
