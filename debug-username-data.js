// Script untuk cek data username di database
// Jalankan dengan: node debug-username-data.js

import prisma from './lib/prisma.js';

async function checkUsernameData() {
  try {
    console.log('🔍 Checking username data...\n');
    
    // Check total members
    const totalMembers = await prisma.members.count();
    console.log(`Total members: ${totalMembers}`);
    
    // Check total usernames
    const totalUsernames = await prisma.user_usernames.count();
    console.log(`Total usernames: ${totalUsernames}`);
    
    // Get members with and without usernames
    const membersWithData = await prisma.members.findMany({
      select: {
        id: true,
        nama_lengkap: true,
        user_usernames: {
          select: {
            username: true,
            display_name: true
          }
        }
      },
      take: 10,
      orderBy: { id: 'asc' }
    });
    
    console.log('\n📋 Sample members data:');
    membersWithData.forEach(member => {
      console.log({
        id: member.id,
        nama_lengkap: member.nama_lengkap,
        username: member.user_usernames?.username || 'NO_USERNAME',
        display_name: member.user_usernames?.display_name || 'NO_DISPLAY_NAME'
      });
    });
    
    // Count members with username vs without
    const membersWithUsername = await prisma.members.count({
      where: {
        user_usernames: {
          isNot: null
        }
      }
    });
    
    console.log(`\n📊 Statistics:`);
    console.log(`Members with username: ${membersWithUsername}/${totalMembers}`);
    console.log(`Members without username: ${totalMembers - membersWithUsername}/${totalMembers}`);
    
    // Check some specific username records
    const usernameRecords = await prisma.user_usernames.findMany({
      take: 5,
      include: {
        members: {
          select: {
            nama_lengkap: true
          }
        }
      }
    });
    
    console.log('\n👤 Sample username records:');
    usernameRecords.forEach(record => {
      console.log({
        id: record.id,
        member_id: record.member_id,
        username: record.username,
        member_name: record.members.nama_lengkap,
        is_custom: record.is_custom
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsernameData();
