import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugDrwcorporaAdmin() {
  try {
    console.log('🔍 Debugging drwcorpora@gmail.com admin status...\n');
    
    // 1. Cek member dengan email drwcorpora@gmail.com
    const memberByEmail = await prisma.members.findFirst({
      where: {
        member_emails: {
          some: {
            email: 'drwcorpora@gmail.com'
          }
        }
      },
      include: {
        member_emails: true
      }
    });
    
    console.log('=== MEMBER BY EMAIL ===');
    console.log('Member found by email:', memberByEmail ? {
      id: memberByEmail.id,
      name: memberByEmail.name,
      clerk_id: memberByEmail.clerk_id,
      emails: memberByEmail.member_emails.map(e => e.email)
    } : 'NOT FOUND');
    console.log();
    
    // 2. Jika ada member, cek privileges berdasarkan clerk_id
    if (memberByEmail && memberByEmail.clerk_id) {
      const privilegesByClerkId = await prisma.user_privileges.findMany({
        where: {
          clerk_id: memberByEmail.clerk_id
        }
      });
      
      console.log('=== PRIVILEGES BY CLERK_ID ===');
      console.log('Privileges found by clerk_id:', privilegesByClerkId.map(p => ({
        id: p.id,
        privilege: p.privilege,
        is_active: p.is_active,
        clerk_id: p.clerk_id,
        granted_at: p.granted_at
      })));
      console.log();
    }
    
    // 3. Cek semua admin privileges yang aktif
    const allActiveAdmins = await prisma.user_privileges.findMany({
      where: {
        privilege: 'admin',
        is_active: true
      }
    });
    
    console.log('=== ALL ACTIVE ADMINS ===');
    console.log('All active admin privileges:', allActiveAdmins.map(p => ({
      id: p.id,
      clerk_id: p.clerk_id,
      granted_at: p.granted_at
    })));
    console.log();
    
    // 4. Recommendations
    console.log('=== ANALYSIS ===');
    if (!memberByEmail) {
      console.log('❌ Member with email drwcorpora@gmail.com not found in members table');
      console.log('   Need to add member with this email first');
    }
    
    let privilegesByClerkId = [];
    if (memberByEmail && memberByEmail.clerk_id) {
      privilegesByClerkId = await prisma.user_privileges.findMany({
        where: {
          clerk_id: memberByEmail.clerk_id
        }
      });
    }
    
    if (privilegesByClerkId.length === 0) {
      console.log('❌ No admin privileges found for clerk_id:', memberByEmail?.clerk_id);
      console.log('   Need to add admin privilege for this clerk_id');
    } else {
      const activeAdminPriv = privilegesByClerkId.find(p => p.privilege === 'admin' && p.is_active);
      if (!activeAdminPriv) {
        console.log('⚠️  Admin privilege exists but not active');
        console.log('   Need to activate admin privilege');
      } else {
        console.log('✅ Active admin privilege found');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDrwcorporaAdmin();