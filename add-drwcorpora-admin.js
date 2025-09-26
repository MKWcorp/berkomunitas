import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addAdminPrivilege() {
  try {
    console.log('🔧 Adding admin privilege for drwcorpora@gmail.com...\n');
    
    const clerkId = 'user_309oPMFO53q4zKuYs5uD7o42EuP';
    
    // Cek apakah sudah ada admin privilege
    const existingAdmin = await prisma.user_privileges.findFirst({
      where: {
        clerk_id: clerkId,
        privilege: 'admin'
      }
    });
    
    if (existingAdmin) {
      console.log('Admin privilege already exists. Updating to active...');
      
      const updated = await prisma.user_privileges.update({
        where: { id: existingAdmin.id },
        data: { 
          is_active: true,
          granted_at: new Date()
        }
      });
      
      console.log('✅ Admin privilege updated:', {
        id: updated.id,
        privilege: updated.privilege,
        is_active: updated.is_active,
        clerk_id: updated.clerk_id
      });
    } else {
      console.log('Creating new admin privilege...');
      
      const newAdmin = await prisma.user_privileges.create({
        data: {
          privilege: 'admin',
          is_active: true,
          clerk_id: clerkId,
          granted_by: 'system_auto'
        }
      });
      
      console.log('✅ New admin privilege created:', {
        id: newAdmin.id,
        privilege: newAdmin.privilege,
        is_active: newAdmin.is_active,
        clerk_id: newAdmin.clerk_id
      });
    }
    
    // Verify the result
    console.log('\n=== VERIFICATION ===');
    const allPrivileges = await prisma.user_privileges.findMany({
      where: { clerk_id: clerkId }
    });
    
    console.log('All privileges for user:', allPrivileges.map(p => ({
      privilege: p.privilege,
      is_active: p.is_active,
      granted_at: p.granted_at
    })));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAdminPrivilege();