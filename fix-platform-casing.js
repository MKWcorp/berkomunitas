const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPlatformCasing() {
  try {
    console.log('🔄 Normalisasi platform casing ke lowercase...');
    
    // Update all Instagram entries to lowercase
    const instagramUpdate = await prisma.profil_sosial_media.updateMany({
      where: {
        platform: 'Instagram'
      },
      data: {
        platform: 'instagram'
      }
    });
    
    console.log('✅ Updated', instagramUpdate.count, 'Instagram entries to lowercase');
    
    // Update other potential case issues
    const tiktokUpdate = await prisma.profil_sosial_media.updateMany({
      where: {
        platform: 'TikTok'
      },
      data: {
        platform: 'tiktok'
      }
    });
    
    console.log('✅ Updated', tiktokUpdate.count, 'TikTok entries to lowercase');
    
    // Check final state
    console.log('\n📊 Platform distribution after fix:');
    const platforms = await prisma.profil_sosial_media.groupBy({
      by: ['platform'],
      _count: { platform: true },
      orderBy: { platform: 'asc' }
    });
    
    platforms.forEach(p => {
      console.log('-', p.platform, ':', p._count.platform, 'entries');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixPlatformCasing();
