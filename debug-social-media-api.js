const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSocialMediaAPI() {
  try {
    console.log('🔍 Testing social media API endpoints...\n');
    
    // Test 1: Check availability endpoint
    console.log('1. Testing check-availability endpoint...');
    
    const availabilityCheck = await prisma.profil_sosial_media.findFirst({
      where: {
        platform: 'instagram',
        username_sosmed: 'dibahas.ai'
      },
      include: {
        members: {
          include: {
            user_usernames: true
          }
        }
      }
    });

    if (availabilityCheck) {
      console.log('❌ Username dibahas.ai sudah ada!');
      const userName = availabilityCheck.members.user_usernames?.display_name || 
                      availabilityCheck.members.user_usernames?.username || 
                      availabilityCheck.members.nama_lengkap || 
                      'Unknown User';
      console.log(`   Dimiliki oleh: ${userName}`);
      console.log(`   Profile ID: ${availabilityCheck.id}`);
      console.log(`   Member ID: ${availabilityCheck.id_member}`);
    } else {
      console.log('✅ Username dibahas.ai available');
    }

    // Test 2: Check database connection and structure
    console.log('\n2. Testing database connection...');
    
    const memberCount = await prisma.members.count();
    console.log(`✅ Database connection OK - ${memberCount} members found`);

    const socialMediaCount = await prisma.profil_sosial_media.count();
    console.log(`✅ Social media table OK - ${socialMediaCount} profiles found`);

    // Test 3: Check for any malformed data
    console.log('\n3. Checking for data integrity issues...');
    
    const malformedProfiles = await prisma.profil_sosial_media.findMany({
      where: {
        OR: [
          { username_sosmed: null },
          { username_sosmed: '' },
          { platform: null },
          { platform: '' }
        ]
      }
    });

    if (malformedProfiles.length > 0) {
      console.log(`⚠️ Found ${malformedProfiles.length} malformed profiles:`);
      malformedProfiles.forEach((profile, idx) => {
        console.log(`   ${idx + 1}. ID: ${profile.id}, Platform: "${profile.platform}", Username: "${profile.username_sosmed}"`);
      });
    } else {
      console.log('✅ No malformed data found');
    }

  } catch (error) {
    console.error('❌ Error during testing:', error);
    console.error('Full error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testSocialMediaAPI();
