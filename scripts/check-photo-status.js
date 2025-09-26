#!/usr/bin/env node

/**
 * Script untuk mengecek status foto profil members
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatus() {
  console.log('📊 DATABASE STATUS');
  console.log('==================');

  try {
    // Total members
    const totalMembers = await prisma.members.count();
    console.log(`Total members: ${totalMembers}`);
    
    // Members with photos
    const withPhotos = await prisma.members.count({
      where: {
        AND: [
          { foto_profil_url: { not: null } },
          { foto_profil_url: { not: '' } },
          { foto_profil_url: { not: 'https://via.placeholder.com/150' } }
        ]
      }
    });
    console.log(`Members with photos: ${withPhotos}`);
    
    // Members without photos
    const withoutPhotos = await prisma.members.count({
      where: {
        OR: [
          { foto_profil_url: null },
          { foto_profil_url: '' },
          { foto_profil_url: 'https://via.placeholder.com/150' }
        ]
      }
    });
    console.log(`Members without photos: ${withoutPhotos}`);
    
    // Members with generated photos (DiceBear)
    const generatedPhotos = await prisma.members.count({
      where: {
        foto_profil_url: { contains: 'dicebear.com' }
      }
    });
    console.log(`Members with generated photos: ${generatedPhotos}`);
    
    console.log('\n📸 RECENT GENERATED PHOTOS:');
    console.log('============================');
      // Recent members with generated photos
    const recentGenerated = await prisma.members.findMany({
      where: {
        foto_profil_url: { contains: 'dicebear.com' }
      },
      select: {
        nama_lengkap: true,
        foto_profil_url: true,
        tanggal_daftar: true
      },
      take: 5,
      orderBy: { tanggal_daftar: 'desc' }
    });
      recentGenerated.forEach((member, index) => {
      console.log(`${index + 1}. ${member.nama_lengkap}`);
      console.log(`   Photo: Generated ✅`);
      console.log(`   Created: ${member.tanggal_daftar}`);
      console.log('');
    });
    
    // Sample members without photos
    console.log('👤 MEMBERS WITHOUT PHOTOS (sample):');
    console.log('===================================');
    
    const membersWithoutPhotos = await prisma.members.findMany({
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
      },      take: 5,
      orderBy: { tanggal_daftar: 'desc' }
    });
    
    if (membersWithoutPhotos.length > 0) {
      membersWithoutPhotos.forEach((member, index) => {
        console.log(`${index + 1}. ${member.nama_lengkap} (ID: ${member.id})`);
        console.log(`   Current photo: ${member.foto_profil_url || 'None'}`);
        console.log(`   Clerk ID: ${member.clerk_id || 'None'}`);
        console.log('');
      });
    } else {
      console.log('🎉 All members have profile photos!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatus();
