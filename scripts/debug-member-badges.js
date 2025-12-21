// Debug script untuk memeriksa data member_badges
// Jalankan dengan: node scripts/debug-member-badges.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugMemberBadges() {
  try {
    console.log('🔍 Checking member_badges table...\n');

    // 1. Count total records
    const totalMemberBadges = await prisma.member_badges.count();
    console.log(`📊 Total member_badges records: ${totalMemberBadges}`);

    // 2. Get sample member badges
    const memberBadges = await prisma.member_badges.findMany({
      take: 10,
      include: {
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            google_id: true
          }
        },
        badges: {
          select: {
            id: true,
            badge_name: true,
            description: true
          }
        }
      }
    });

    console.log('\n🎖️ Sample member badges:');
    memberBadges.forEach(mb => {
      console.log(`- Member ID: ${mb.id_member}, Badge ID: ${mb.id_badge}`);
      console.log(`  Member: ${mb.members?.nama_lengkap || 'Unknown'}`);
      console.log(`  Badge: ${mb.badges?.badge_name || 'Unknown'}`);
      console.log(`  Earned: ${mb.earned_at}`);
      console.log('---');
    });

    // 3. Check for members who have badges
    const membersWithBadges = await prisma.members.findMany({
      where: {
        member_badges: {
          some: {}
        }
      },
      select: {
        id: true,
        nama_lengkap: true,
        member_badges: {
          include: {
            badges: true
          }
        }
      }
    });

    console.log(`\n👥 Members with badges: ${membersWithBadges.length}`);
    membersWithBadges.forEach(member => {
      console.log(`- ${member.nama_lengkap} (ID: ${member.id}) has ${member.member_badges.length} badge(s)`);
      member.member_badges.forEach(mb => {
        console.log(`  → ${mb.badges.badge_name}`);
      });
    });

    // 4. Check badge distribution
    const badgeStats = await prisma.member_badges.groupBy({
      by: ['id_badge'],
      _count: {
        id_member: true
      },
      orderBy: {
        _count: {
          id_member: 'desc'
        }
      }
    });

    console.log('\n📈 Badge distribution:');
    for (const stat of badgeStats) {
      const badge = await prisma.badges.findUnique({
        where: { id: stat.id_badge }
      });
      console.log(`- ${badge?.badge_name || 'Unknown badge'}: ${stat._count.id_member} members`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugMemberBadges();
