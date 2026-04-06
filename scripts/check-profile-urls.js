/**
 * Cek dan update profile_url di database
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndFixProfileUrls() {
  console.log('\n🔍 CHECKING PROFILE URLs IN DATABASE');
  console.log('='.repeat(70));
  
  try {
    // Cek semua members dengan foto_profil_url
    const users = await prisma.members.findMany({
      where: {
        foto_profil_url: {
          not: null
        }
      },
      select: {
        id: true,
        nama_lengkap: true,
        foto_profil_url: true,
      },
      orderBy: {
        id: 'asc'
      },
      take: 100,
    });
    
    console.log(`📊 Total members dengan foto_profil_url: ${users.length}`);
    console.log('');
    
    // Analisis URL
    const oldHttps = users.filter(u => u.foto_profil_url.includes('https://storage.berkomunitas.com'));
    const oldCloudinary = users.filter(u => u.foto_profil_url.includes('cloudinary.com'));
    const newCorrect = users.filter(u => u.foto_profil_url.includes('213.190.4.159:9100'));
    const other = users.filter(u => 
      !u.foto_profil_url.includes('storage.berkomunitas.com') && 
      !u.foto_profil_url.includes('cloudinary.com') &&
      !u.foto_profil_url.includes('213.190.4.159:9100')
    );
    
    console.log('📋 URL Statistics:');
    console.log(`   ❌ Old HTTPS (broken): ${oldHttps.length}`);
    console.log(`   🟡 Cloudinary (legacy): ${oldCloudinary.length}`);
    console.log(`   ✅ New correct (9100): ${newCorrect.length}`);
    console.log(`   ❓ Other: ${other.length}`);
    console.log('');
    
    if (oldHttps.length > 0) {
      console.log('⚠️  URLs yang perlu diperbaiki:');
      oldHttps.slice(0, 5).forEach((user, i) => {
        console.log(`   ${i + 1}. User ${user.user_id} (${user.name})`);
        console.log(`      Old: ${user.profile_url}`);
        
        // Ekstrak filename dari URL lama
        const filename = user.profile_url.split('/').pop();
        const newUrl = `http://213.190.4.159:9100/berkomunitas/profile-pictures/${filename}`;
        console.log(`      New: ${newUrl}`);
        console.log('');
      });
      
      console.log(`\n💡 Perlu update ${oldHttps.length} URLs.`);
      console.log('   Run: node scripts/fix-profile-urls.js');
    } else {
      console.log('✅ Semua URLs sudah benar!');
    }
    
    // Sample URLs
    if (users.length > 0) {
      console.log('\n📸 Sample profile URLs:');
      users.slice(0, 5).forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.name}: ${user.profile_url}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixProfileUrls();
