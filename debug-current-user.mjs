// Debug script to check current user privilege level
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debugCurrentUser() {
  try {
    console.log('🔍 Fetching all members with their privilege levels...');
    
    const members = await prisma.members.findMany({
      select: {
        id: true,
        clerk_id: true,
        nama: true,
        privilege_level: true,
        email: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' },
      take: 10 // Show latest 10 members
    });
    
    console.log('📋 Latest members:');
    members.forEach((member, index) => {
      console.log(`${index + 1}. Name: ${member.nama || 'N/A'}`);
      console.log(`   Email: ${member.email || 'N/A'}`);
      console.log(`   Clerk ID: ${member.clerk_id || 'N/A'}`);
      console.log(`   Privilege: ${member.privilege_level || 'N/A'}`);
      console.log(`   Created: ${member.created_at || 'N/A'}`);
      console.log('   ---');
    });
    
    // Check admin count
    const adminCount = await prisma.members.count({
      where: { privilege_level: 'admin' }
    });
    
    console.log(`\n👑 Total admin users: ${adminCount}`);
    
    if (adminCount === 0) {
      console.log('\n⚠️  No admin users found! You may need to manually set a user as admin.');
      console.log('💡 To make a user admin, run in database:');
      console.log('UPDATE members SET privilege_level = \'admin\' WHERE id = YOUR_USER_ID;');
    }
    
    // Show current admin users
    if (adminCount > 0) {
      const adminUsers = await prisma.members.findMany({
        where: { privilege_level: 'admin' },
        select: {
          id: true,
          clerk_id: true,
          nama: true,
          email: true
        }
      });
      
      console.log('\n👑 Current admin users:');
      adminUsers.forEach((admin, index) => {
        console.log(`${index + 1}. Name: ${admin.nama || 'N/A'}`);
        console.log(`   Email: ${admin.email || 'N/A'}`);
        console.log(`   Clerk ID: ${admin.clerk_id || 'N/A'}`);
        console.log('   ---');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCurrentUser();
