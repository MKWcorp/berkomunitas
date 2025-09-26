const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugMemberBadges() {
  console.log('🔍 Debug Member Badges Data\n');
  
  try {
    // 1. Check total member_badges records
    const totalMemberBadges = await prisma.member_badges.count();
    console.log(`📊 Total member_badges records: ${totalMemberBadges}`);
    
    // 2. Get sample member badges with relations
    const sampleMemberBadges = await prisma.member_badges.findMany({
      include: {
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            clerk_id: true,
            nomer_wa: true
          }
        },
        badges: {
          select: {
            id: true,
            badge_name: true,
            description: true,
            criteria_type: true,
            criteria_value: true
          }
        }
      },
      take: 5,
      orderBy: [
        { earned_at: 'desc' }
      ]
    });
    
    console.log(`\n🎯 Sample member badges (first 5):`);
    sampleMemberBadges.forEach((mb, index) => {
      console.log(`${index + 1}. ID: ${mb.id}`);
      console.log(`   Member ID: ${mb.id_member} (${mb.members?.nama_lengkap || 'No name'})`);
      console.log(`   Badge ID: ${mb.id_badge} (${mb.badges?.badge_name || 'No badge'})`);
      console.log(`   Earned: ${mb.earned_at}`);
      console.log('');
    });
    
    // 3. Check if we have any null relations
    const badgesWithNullMembers = await prisma.member_badges.findMany({
      where: {
        members: null
      }
    });
    
    const badgesWithNullBadges = await prisma.member_badges.findMany({
      where: {
        badges: null
      }
    });
    
    console.log(`⚠️  Records with null members: ${badgesWithNullMembers.length}`);
    console.log(`⚠️  Records with null badges: ${badgesWithNullBadges.length}`);
    
    // 4. Check API endpoint structure
    console.log('\n🔧 Expected API Response Structure:');
    console.log({
      memberBadges: sampleMemberBadges.map(mb => ({
        id: mb.id,
        id_member: mb.id_member,
        id_badge: mb.id_badge,
        earned_at: mb.earned_at,
        members: mb.members,
        badges: mb.badges
      })),
      total: totalMemberBadges
    });
    
    // 5. Test mapping logic
    console.log('\n🗺️  Frontend Mapping Test:');
    const mappedMemberBadges = sampleMemberBadges.map(mb => ({
      id: mb.id,
      member_id: mb.id_member,
      badge_id: mb.id_badge,
      earned_date: mb.earned_at,
      member: {
        id: mb.members?.id,
        name: mb.members?.nama_lengkap || 'Nama tidak tersedia',
        clerk_id: mb.members?.clerk_id
      },
      badge: mb.badges
    }));
    
    console.log('Mapped data for frontend:', JSON.stringify(mappedMemberBadges, null, 2));
    
    // 6. Check unique members who have badges
    const uniqueMembers = await prisma.member_badges.groupBy({
      by: ['id_member'],
      _count: {
        id_badge: true
      }
    });
    
    console.log(`\n👥 Unique members with badges: ${uniqueMembers.length}`);
    uniqueMembers.forEach(member => {
      console.log(`   Member ID ${member.id_member}: ${member._count.id_badge} badges`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugMemberBadges();
