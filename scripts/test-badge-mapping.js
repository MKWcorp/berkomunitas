// Test script untuk memeriksa mapping badge data di frontend
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBadgeMapping() {
  try {
    console.log('🔍 Testing badge mapping logic...');
    
    // Simulate what the API endpoint returns
    const memberBadges = await prisma.member_badges.findMany({
      include: {
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            google_id: true,
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
      orderBy: [
        { earned_at: 'desc' }
      ]
    });

    console.log(`\n📊 Found ${memberBadges.length} member badge assignments`);

    // Simulate the mapping logic from BadgesTab.js
    const mappedMemberBadges = memberBadges.map(mb => ({
      id: mb.id,
      member_id: mb.id_member,
      badge_id: mb.id_badge,
      earned_date: mb.earned_at,
      member: {
        id: mb.members.id,
        name: mb.members.nama_lengkap || 'Nama tidak tersedia',
        google_id: mb.members.clerk_id
      },
      badge: mb.badges
    }));

    console.log('\n🗂️ Mapped member badges (first 3):');
    console.log(JSON.stringify(mappedMemberBadges.slice(0, 3), null, 2));

    // Simulate the memberBadgeMap creation
    const memberBadgeMap = {};
    mappedMemberBadges.forEach(mb => {
      if (!memberBadgeMap[mb.member_id]) {
        memberBadgeMap[mb.member_id] = [];
      }
      memberBadgeMap[mb.member_id].push(mb.badge);
    });

    console.log('\n🗺️ Member Badge Map:');
    console.log(JSON.stringify(memberBadgeMap, null, 2));

    // Test some specific members
    const testMembers = [9, 10, 12, 15]; // Based on sample data
    console.log('\n🧪 Testing specific members:');
    testMembers.forEach(memberId => {
      const badges = memberBadgeMap[memberId] || [];
      console.log(`Member ID ${memberId}: ${badges.length} badges`);
      if (badges.length > 0) {
        badges.forEach(badge => {
          console.log(`  - ${badge.badge_name}`);
        });
      }
    });

  } catch (error) {
    console.error('Error testing badge mapping:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBadgeMapping();
