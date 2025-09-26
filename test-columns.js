const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testColumns() {
  try {
    console.log('🔍 Testing new columns in members table...');
    
    // Test foto_profil_url column 
    const member = await prisma.members.findFirst({
      select: {
        id: true,
        nama_lengkap: true,
        foto_profil_url: true,
        bio: true,
        status_kustom: true,
        featured_badge_id: true
      }
    });
    
    console.log('✅ SUCCESS: All new columns accessible!');
    console.log('Sample member data:', {
      id: member?.id,
      nama_lengkap: member?.nama_lengkap,
      foto_profil_url: member?.foto_profil_url || '(NULL)',
      bio: member?.bio || '(NULL)',
      status_kustom: member?.status_kustom || '(NULL)',
      featured_badge_id: member?.featured_badge_id || '(NULL)'
    });
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testColumns();
