const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugUserPrivileges() {
  const clerkId = 'user_30yTnOAZrelMbgRiX4pajLlhLpB';
  
  console.log('🔍 Debugging user privileges...');
  console.log('Clerk ID:', clerkId);
  console.log();
  
  try {
    // 1. Cek member data
    const member = await prisma.members.findFirst({
      where: { clerk_id: clerkId },
      include: {
        member_emails: true,
        user_privileges: {
          where: { is_active: true },
          select: {
            privilege: true,
            granted_at: true,
            expires_at: true,
            is_active: true
          }
        }
      }
    });
    
    console.log('=== MEMBER DATA ===');
    if (member) {
      console.log('✅ Member found:', {
        id: member.id,
        nama_lengkap: member.nama_lengkap,
        clerk_id: member.clerk_id,
        emails: member.member_emails.map(e => e.email)
      });
      console.log();
      
      console.log('=== PRIVILEGE DATA ===');
      if (member.user_privileges && member.user_privileges.length > 0) {
        console.log('✅ Active privileges found:');
        member.user_privileges.forEach(p => {
          console.log(`   - ${p.privilege} (granted: ${p.granted_at}, expires: ${p.expires_at || 'never'})`);
        });
      } else {
        console.log('❌ No active privileges found');
      }
    } else {
      console.log('❌ Member not found');
      return;
    }
    
    console.log();
    
    // 2. Test API response simulation
    console.log('=== API RESPONSE SIMULATION ===');
    const apiResponse = {
      success: true,
      data: {
        member: {
          id: member.id,
          nama_lengkap: member.nama_lengkap,
          foto_profil_url: member.foto_profil_url
        },
        privileges: member.user_privileges,
        level: { current: { level_number: 1 }, next: null }
      }
    };
    
    console.log('API privileges array:', JSON.stringify(apiResponse.data.privileges, null, 2));
    
    // 3. Test ProfileSection logic
    console.log();
    console.log('=== PROFILE SECTION LOGIC TEST ===');
    
    // Simulate new getHighestPrivilege logic
    const getHighestPrivilege = (privileges) => {
      if (!privileges || privileges.length === 0) return 'user';
      
      const privilegeHierarchy = { 'user': 1, 'berkomunitasplus': 2, 'partner': 3, 'admin': 4 };
      let highest = 'user';
      let highestLevel = 0;
      
      privileges.forEach(p => {
        const level = privilegeHierarchy[p.privilege] || 0;
        if (level > highestLevel) {
          highest = p.privilege;
          highestLevel = level;
        }
      });
      
      return highest;
    };
    
    const userCurrentPrivilege = getHighestPrivilege(apiResponse.data.privileges);
    
    console.log('OLD logic - first privilege:', apiResponse.data.privileges[0]?.privilege);
    console.log('NEW logic - highest privilege:', userCurrentPrivilege);
    
    // Import and test getDisplayPrivileges
    const { getDisplayPrivileges } = require('./src/utils/privilegeChecker');
    const displayPrivileges = getDisplayPrivileges(userCurrentPrivilege);
    
    console.log('Display privileges (NEW logic):', displayPrivileges);
    console.log();
    
    // 4. What user expects vs what they get
    console.log('=== EXPECTATION vs REALITY ===');
    if (userCurrentPrivilege === 'admin') {
      console.log('User expectation: [user, berkomunitasplus, partner, admin]');
      console.log('Current result  :', displayPrivileges);
      console.log('Missing labels  :', ['user', 'partner'].filter(p => !displayPrivileges.includes(p)));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserPrivileges();