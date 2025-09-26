// Debug script untuk memeriksa data member_badges
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugBadgeIssue() {
  try {
    console.log('🔍 Checking member_badges table...');
    
    // 1. Check if member_badges table has any data
    const memberBadgesCount = await prisma.member_badges.count();
    console.log(`Total member_badges records: ${memberBadgesCount}`);
    
    // 2. Check first few records
    const sampleMemberBadges = await prisma.member_badges.findMany({
      take: 5,
      include: {
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            clerk_id: true
          }
        },
        badges: {
          select: {
            id: true,
            badge_name: true,
            description: true
          }
        }
      }
    });
    
    console.log('\n📋 Sample member_badges data:');
    console.log(JSON.stringify(sampleMemberBadges, null, 2));
    
    // 3. Check if badges table has data
    const badgesCount = await prisma.badges.count();
    console.log(`\n🏆 Total badges available: ${badgesCount}`);
    
    // 4. Check members count
    const membersCount = await prisma.members.count();
    console.log(`👥 Total members: ${membersCount}`);
    
    // 5. Check what API endpoint returns
    console.log('\n🌐 Testing API endpoint...');
    const API_URL = 'http://localhost:3000/api/admin/member-badges';
    
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(API_URL);
      if (response.ok) {
        const apiData = await response.json();
        console.log('API Response:');
        console.log(JSON.stringify(apiData, null, 2));
      } else {
        console.log('API Error:', response.status, response.statusText);
      }
    } catch (apiError) {
      console.log('API call failed:', apiError.message);
    }
    
  } catch (error) {
    console.error('Error debugging badge issue:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugBadgeIssue();
