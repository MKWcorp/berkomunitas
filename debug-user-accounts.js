const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserSocialMedia() {
  try {
    console.log('🔍 Mencari akun sosial media user saat ini...\n');
    
    // Get all social media accounts untuk debugging
    const allSocialMedia = await prisma.profil_sosial_media.findMany({
      include: {
        members: {
          include: {
            user_usernames: true
          }
        }
      },
      orderBy: [
        { platform: 'asc' },
        { id: 'asc' }
      ]
    });

    console.log('📋 SEMUA AKUN SOSIAL MEDIA:');
    console.log('='.repeat(80));
    
    const groupedByPlatform = {};
    allSocialMedia.forEach(account => {
      if (!groupedByPlatform[account.platform]) {
        groupedByPlatform[account.platform] = [];
      }
      groupedByPlatform[account.platform].push(account);
    });

    Object.keys(groupedByPlatform).forEach(platform => {
      console.log(`\n📱 ${platform.toUpperCase()}:`);
      groupedByPlatform[platform].forEach((account, idx) => {
        const userName = account.members.user_usernames?.display_name || 
                        account.members.user_usernames?.username || 
                        account.members.nama_lengkap || 
                        'Unknown User';
        console.log(`  ${idx + 1}. @${account.username_sosmed} - ${userName} (Member ID: ${account.id_member}, Profile ID: ${account.id})`);
        console.log(`     Link: ${account.profile_link || 'N/A'}`);
        console.log(`     Clerk ID: ${account.members.clerk_id}`);
      });
    });

    // Check Instagram specifically
    const instagramAccounts = groupedByPlatform.instagram || [];
    console.log(`\n📊 Total akun Instagram: ${instagramAccounts.length}`);
    
    if (instagramAccounts.length > 0) {
      console.log('\n💡 ANALISIS:');
      console.log('Sistem saat ini membatasi 1 akun per platform per user.');
      console.log('Jika ingin multiple akun Instagram, perlu modifikasi validasi.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserSocialMedia();
