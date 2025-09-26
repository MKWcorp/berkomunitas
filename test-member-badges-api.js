import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMemberBadgesQuery() {
  console.log('🔍 Testing member badges query...');
  
  try {
    const memberBadges = await prisma.memberBadges.findMany({
      take: 1,
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
            criteria_value: true,
            badge_color: true,      // ✅ Should be included now
            badge_style: true,      // ✅ Should be included now  
            badge_message: true     // ✅ Should be included now
          }
        }
      }
    });

    console.log('📋 Sample member badge with customization:', JSON.stringify(memberBadges[0], null, 2));
    
    if (memberBadges[0]?.badges) {
      const badge = memberBadges[0].badges;
      console.log('\n🎨 Badge customization check:');
      console.log(`- badge_color: ${badge.badge_color || 'null'}`);
      console.log(`- badge_style: ${badge.badge_style || 'null'}`);
      console.log(`- badge_message: ${badge.badge_message || 'null'}`);
      
      if (badge.badge_color || badge.badge_style || badge.badge_message) {
        console.log('✅ Badge customization fields are included!');
      } else {
        console.log('⚠️ Badge customization fields are null (which is normal if not set)');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMemberBadgesQuery();
