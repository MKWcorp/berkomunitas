const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBerkomunitasplusSystem() {
  console.log('🔍 Checking berkomunitasplus privilege for drwcorpora@gmail.com...');
  
  try {
    // Find member by email
    const member = await prisma.members.findFirst({
      where: {
        member_emails: {
          some: {
            email: 'drwcorpora@gmail.com'
          }
        }
      },
      include: {
        member_emails: true,
        user_privileges: {
          where: { is_active: true },
          select: {
            privilege: true,
            granted_at: true,
            expires_at: true
          }
        }
      }
    });

    if (!member) {
      console.log('❌ Member with email drwcorpora@gmail.com not found');
      return;
    }

    console.log('✅ Member found:', member.nama_lengkap);
    console.log('   Emails:', member.member_emails.map(e => e.email).join(', '));
    console.log('   Clerk ID:', member.clerk_id);
    
    const activePrivilege = member.user_privileges[0];
    if (activePrivilege) {
      console.log('✅ Active privilege:', activePrivilege.privilege);
      console.log('   Granted at:', activePrivilege.granted_at);
      console.log('   Expires at:', activePrivilege.expires_at || 'Never');
      
      if (activePrivilege.privilege === 'berkomunitasplus') {
        console.log('🌟 SUCCESS: berkomunitasplus privilege is active!');
        console.log('📱 This user should see a gold gradient badge on profile page');
        console.log('🔗 Profile URL: http://localhost:3000/profil');
      }
    } else {
      console.log('⚠️ No active privileges found');
    }

    // Test API response format
    console.log('\n📡 Testing API response format...');
    const apiResponse = {
      success: true,
      data: {
        member: {
          id: member.id,
          nama_lengkap: member.nama_lengkap,
          emails: member.member_emails,
          foto_profil_url: member.foto_profil_url
        },
        privileges: member.user_privileges,
        level: { current: { level_number: 1 }, next: null }
      }
    };
    
    console.log('API privileges format:', JSON.stringify(apiResponse.data.privileges, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBerkomunitasplusSystem();