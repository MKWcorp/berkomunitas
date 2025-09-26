const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupUserPrivileges() {
  const clerkId = 'user_30yTnOAZrelMbgRiX4pajLlhLpB';
  
  console.log('🔧 Cleaning up user privileges...');
  console.log('Clerk ID:', clerkId);
  console.log();
  
  try {
    // 1. Cek current state
    const currentPrivileges = await prisma.user_privileges.findMany({
      where: { 
        clerk_id: clerkId,
        is_active: true 
      },
      orderBy: { granted_at: 'desc' }
    });
    
    console.log('=== CURRENT STATE ===');
    console.log('Active privileges:');
    currentPrivileges.forEach(p => {
      console.log(`   - ${p.privilege} (ID: ${p.id}, granted: ${p.granted_at})`);
    });
    
    if (currentPrivileges.length <= 1) {
      console.log('✅ No cleanup needed - user has only one active privilege');
      return;
    }
    
    console.log();
    console.log('=== CLEANUP PROCESS ===');
    
    // 2. Deactivate user privilege (keep only admin)
    const userPrivilege = currentPrivileges.find(p => p.privilege === 'user');
    if (userPrivilege) {
      await prisma.user_privileges.update({
        where: { id: userPrivilege.id },
        data: { is_active: false }
      });
      console.log('✅ Deactivated user privilege (ID: ' + userPrivilege.id + ')');
    }
    
    // 3. Verify final state
    const finalPrivileges = await prisma.user_privileges.findMany({
      where: { 
        clerk_id: clerkId,
        is_active: true 
      }
    });
    
    console.log();
    console.log('=== FINAL STATE ===');
    console.log('Active privileges after cleanup:');
    finalPrivileges.forEach(p => {
      console.log(`   - ${p.privilege} (ID: ${p.id})`);
    });
    
    console.log();
    console.log('✅ Cleanup completed successfully!');
    console.log('User now has admin privilege only (with hierarchical UI display)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupUserPrivileges();