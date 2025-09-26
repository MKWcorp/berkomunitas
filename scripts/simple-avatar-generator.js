#!/usr/bin/env node

/**
 * Script sederhana untuk generate foto profil otomatis
 * Jalankan dengan: node scripts/simple-avatar-generator.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Avatar generator menggunakan DiceBear API
function generateAvatarUrl(member) {
  const seed = member.nama_lengkap || member.clerk_id || `user${member.id}`;
  const encodedSeed = encodeURIComponent(seed.toLowerCase().trim());
  
  // Menggunakan DiceBear Avataaars style
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodedSeed}&size=200&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

async function generateProfilePhotos() {
  console.log('🚀 GENERATE PROFILE PHOTOS - SIMPLE VERSION');
  console.log('============================================');

  try {
    // Cari members yang belum punya foto profil
    const members = await prisma.members.findMany({
      where: {
        OR: [
          { foto_profil_url: null },
          { foto_profil_url: '' },
          { foto_profil_url: 'https://via.placeholder.com/150' }
        ]
      },
      select: {
        id: true,
        nama_lengkap: true,
        clerk_id: true,
        foto_profil_url: true
      },
      take: 20 // Limit untuk testing
    });

    console.log(`📊 Found ${members.length} members without profile photos`);
    console.log('');

    let updated = 0;

    for (const member of members) {
      console.log(`👤 Processing: ${member.nama_lengkap} (ID: ${member.id})`);
      
      // Generate avatar URL
      const avatarUrl = generateAvatarUrl(member);
      console.log(`🎨 Generated avatar: ${avatarUrl}`);

      try {
        // Update database
        await prisma.members.update({
          where: { id: member.id },
          data: { foto_profil_url: avatarUrl }
        });
        
        console.log(`✅ Updated successfully`);
        updated++;
      } catch (error) {
        console.log(`❌ Failed to update: ${error.message}`);
      }
      
      console.log('');
    }

    console.log('📈 SUMMARY');
    console.log('===========');
    console.log(`✅ Successfully updated: ${updated}/${members.length} members`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Jalankan script
generateProfilePhotos();
