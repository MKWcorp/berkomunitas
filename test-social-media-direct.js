// test-social-media-direct.js - Direct test of social media data loading
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSocialMediaData() {
  try {
    console.log('🔍 Testing social media data loading...\n');
    
    // Test 1: Get all members with social media profiles
    console.log('1. Fetching all members with social media profiles...');
    const members = await prisma.members.findMany({
      include: {
        profil_sosial_media: {
          orderBy: { platform: 'asc' }
        },
        member_emails: {
          where: { is_primary: true },
          select: { email: true }
        }
      },
      orderBy: { nama_lengkap: 'asc' }
    });
    
    console.log(`Found ${members.length} members total`);
    
    // Test 2: Transform to social media profiles
    const socialMediaProfiles = [];
    
    members.forEach(member => {
      if (member.profil_sosial_media.length > 0) {
        member.profil_sosial_media.forEach(profile => {
          socialMediaProfiles.push({
            id: profile.id,
            platform: profile.platform,
            username: profile.username_sosmed,
            account_url: profile.profile_link,
            member: {
              id: member.id,
              nama_lengkap: member.nama_lengkap,
              foto_profil_url: member.foto_profil_url,
              email: member.member_emails[0]?.email || 'Tidak ada email',
              clerk_id: member.clerk_id
            }
          });
        });
      }
    });
    
    console.log(`Found ${socialMediaProfiles.length} social media profiles`);
    
    // Test 3: Show sample data
    if (socialMediaProfiles.length > 0) {
      console.log('\n📄 Sample social media profile:');
      console.log(JSON.stringify(socialMediaProfiles[0], null, 2));
    }
    
    // Test 4: Get platforms
    const platforms = await prisma.profil_sosial_media.findMany({
      select: {
        platform: true
      },
      distinct: ['platform'],
      orderBy: {
        platform: 'asc'
      }
    });
    
    const platformList = platforms.map(p => p.platform);
    console.log('\n🏷️  Available platforms:', platformList);
    
    // Test 5: Mock API response
    const apiResponse = {
      success: true,
      socialMedias: socialMediaProfiles,
      platforms: platformList,
      total: socialMediaProfiles.length
    };
    
    console.log('\n✅ Mock API Response structure:');
    console.log('- Success:', apiResponse.success);
    console.log('- SocialMedias count:', apiResponse.socialMedias.length);
    console.log('- Platforms:', apiResponse.platforms);
    console.log('- Total:', apiResponse.total);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSocialMediaData();
