const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeDuplicateAccount() {
  try {
    console.log('🗑️ Menghapus duplikasi akun Instagram @wildanarifff dari Tara DFS...\n');
    
    // First, verify the duplicate exists
    const duplicateProfile = await prisma.profil_sosial_media.findUnique({
      where: {
        id: 155 // Profile ID dari Tara DFS
      },
      include: {
        members: {
          include: {
            user_usernames: true
          }
        }
      }
    });

    if (!duplicateProfile) {
      console.log('❌ Profile ID 155 tidak ditemukan!');
      return;
    }

    console.log('📋 Detail profile yang akan dihapus:');
    console.log(`   Profile ID: ${duplicateProfile.id}`);
    console.log(`   Member ID: ${duplicateProfile.id_member}`);
    console.log(`   Platform: ${duplicateProfile.platform}`);
    console.log(`   Username: @${duplicateProfile.username_sosmed}`);
    console.log(`   Profile Link: ${duplicateProfile.profile_link}`);
    
    const userName = duplicateProfile.members.user_usernames?.display_name || 
                     duplicateProfile.members.user_usernames?.username || 
                     duplicateProfile.members.nama_lengkap || 
                     'Unknown User';
    console.log(`   User: ${userName}`);
    console.log(`   Clerk ID: ${duplicateProfile.members.clerk_id}\n`);

    // Confirm this is the right record to delete
    if (duplicateProfile.username_sosmed !== 'wildanarifff' || duplicateProfile.platform !== 'instagram') {
      console.log('❌ Profile tidak sesuai! Tidak akan menghapus.');
      return;
    }

    // Delete the duplicate profile
    const deleted = await prisma.profil_sosial_media.delete({
      where: {
        id: 155
      }
    });

    console.log('✅ BERHASIL MENGHAPUS DUPLIKASI!');
    console.log(`   Profil sosial media ID ${deleted.id} telah dihapus`);
    console.log(`   Username @${deleted.username_sosmed} di ${deleted.platform} tidak lagi diklaim oleh Tara DFS`);
    
    // Verify no more duplicates exist
    console.log('\n🔍 Mengecek apakah masih ada duplikasi...');
    const remainingDuplicates = await prisma.profil_sosial_media.findMany({
      where: {
        platform: 'instagram',
        username_sosmed: 'wildanarifff'
      },
      include: {
        members: {
          include: {
            user_usernames: true
          }
        }
      }
    });

    console.log(`📊 Sisa klaim untuk @wildanarifff: ${remainingDuplicates.length} user`);
    remainingDuplicates.forEach((profile, idx) => {
      const userName = profile.members.user_usernames?.display_name || 
                      profile.members.user_usernames?.username || 
                      profile.members.nama_lengkap || 
                      'Unknown User';
      console.log(`   ${idx + 1}. ${userName} (Profile ID: ${profile.id}, Member ID: ${profile.id_member})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

removeDuplicateAccount();
