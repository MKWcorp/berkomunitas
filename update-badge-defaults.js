import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateBadgesWithDefaults() {
  try {
    console.log('🚀 Updating existing badges with default shield values...');

    // Update all existing badges to set default values using raw SQL
    const updateResult = await prisma.$executeRaw`
      UPDATE badges 
      SET badge_color = 'blue', badge_style = 'flat' 
      WHERE badge_color IS NULL OR badge_style IS NULL OR badge_color = '' OR badge_style = ''
    `;

    console.log(`✅ Updated ${updateResult} badges with default values`);

    // Show current badges
    const badges = await prisma.badges.findMany({
      select: {
        id: true,
        badge_name: true,
        badge_color: true,
        badge_style: true
      }
    });

    console.log('\n📊 Current badges with shield config:');
    console.table(badges);

    console.log('\n🎉 Badge defaults update completed successfully!');

  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateBadgesWithDefaults();
