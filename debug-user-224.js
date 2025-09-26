const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugUser224() {
  try {
    console.log('🔍 Debugging User 224 Admin Access...\n');
    
    // 1. Cari user 224 
    const member = await prisma.members.findUnique({
      where: { id: 224 },
      include: {
        member_emails: true
      }
    });
    
    if (!member) {
      console.log('❌ User 224 tidak ditemukan di table members!');
      return;
    }
    
    console.log('👤 User 224 Found:');
    console.log(`   ID: ${member.id.toString()}`);
    console.log(`   Name: ${member.name || 'No name'}`);
    console.log(`   Clerk ID: ${member.clerk_id || 'No clerk ID'}`);
    console.log(`   Email: ${member.member_emails[0]?.email || 'No email'}`);
    console.log();
    
    if (!member.clerk_id) {
      console.log('❌ Problem: User 224 tidak memiliki Clerk ID!');
      console.log('💡 Perlu update clerk_id untuk user ini');
      return;
    }
    
    // 2. Cek privileges berdasarkan clerk_id
    const privileges = await prisma.user_privileges.findMany({
      where: { 
        clerk_id: member.clerk_id
      }
    });
    
    console.log(`🔐 Current Privileges for Clerk ID (${member.clerk_id}):`);
    if (privileges.length === 0) {
      console.log('   ❌ No privileges found!');
    } else {
      privileges.forEach(priv => {
        console.log(`   - ${priv.privilege}: ${priv.is_active ? '✅ Active' : '❌ Inactive'}`);
        console.log(`     Granted: ${priv.granted_at}`);
        console.log(`     ID: ${priv.id}`);
      });
    }
    console.log();
    
    // 3. Cek apakah sudah ada admin privilege yang aktif
    const adminPrivilege = privileges.find(p => p.privilege === 'admin' && p.is_active);
    
    if (adminPrivilege) {
      console.log('✅ User 224 sudah memiliki admin privilege yang aktif!');
      console.log('🤔 Masalah mungkin di authentication flow atau API');
    } else {
      console.log('❌ User 224 TIDAK memiliki admin privilege yang aktif');
      console.log('💡 Menambahkan admin privilege sekarang...');
      
      // 4. Tambahkan admin privilege
      try {
        const newPrivilege = await prisma.user_privileges.create({
          data: {
            clerk_id: member.clerk_id,
            privilege: 'admin',
            is_active: true,
            granted_by: 'system_fix',
            granted_at: new Date()
          }
        });
        
        console.log(`✅ Admin privilege berhasil ditambahkan! ID: ${newPrivilege.id}`);
      } catch (error) {
        console.error('❌ Error menambahkan admin privilege:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugUser224();
