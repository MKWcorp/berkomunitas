import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminStatus() {
  try {
    console.log('🔍 Checking admin status...\n');
    
    // Get all admin privileges
    const adminPrivileges = await prisma.user_privileges.findMany({
      where: {
        privilege: 'admin',
        is_active: true
      },
      include: {
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            clerk_id: true
          }
        }
      }
    });
    
    console.log(`👑 Active admin users: ${adminPrivileges.length}`);
    adminPrivileges.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.members?.nama_lengkap || 'No name'}`);
      console.log(`   Clerk ID: ${admin.clerk_id}`);
      console.log(`   Member ID: ${admin.members?.id}`);
      console.log('');
    });
    
    // Check if there are any members without admin privileges trying to access
    const totalMembers = await prisma.members.count();
    console.log(`👥 Total members: ${totalMembers}`);
    console.log(`🔐 Admin ratio: ${adminPrivileges.length}/${totalMembers}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminStatus();
