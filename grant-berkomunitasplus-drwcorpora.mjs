/**
 * Script untuk memberikan privilege 'berkomunitasplus' kepada akun drwcorpora@gmail.com
 * Date: September 19, 2025
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn', 'info'],
});

async function grantBerkomunitaPlusPrivilege() {
  const targetEmail = 'drwcorpora@gmail.com';
  
  console.log('🚀 Starting privilege grant script...');
  console.log('Target email:', targetEmail);
  
  try {
    console.log('🔍 Mencari member dengan email:', targetEmail);
    
    // 1. Cari member berdasarkan email di member_emails table
    const memberEmail = await prisma.member_emails.findUnique({
      where: { email: targetEmail },
      include: {
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            clerk_id: true,
            nomer_wa: true,
            tanggal_daftar: true
          }
        }
      }
    });

    if (!memberEmail) {
      // Jika tidak ada di member_emails, mungkin ada bug di sistem
      console.log('   ❌ Tidak ditemukan di member_emails table');
      console.log('   ℹ️  Email ini mungkin belum terdaftar di sistem member_emails');
      return;
    }

    return await grantPrivilegeToMember(memberEmail.members, targetEmail);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function grantPrivilegeToMember(member, email) {
  console.log('✅ Member ditemukan:');
  console.log('   ID:', member.id);
  console.log('   Nama:', member.nama_lengkap || 'N/A');
  console.log('   Clerk ID:', member.clerk_id || 'N/A');
  console.log('   Email:', email);
  console.log('   Nomer WA:', member.nomer_wa || 'N/A');

  // 2. Cek privilege yang sudah ada
  console.log('\n🔍 Mengecek privilege yang sudah ada...');
  
  const existingPrivileges = await prisma.user_privileges.findMany({
    where: {
      clerk_id: member.clerk_id,
      is_active: true
    },
    select: {
      id: true,
      privilege: true,
      granted_at: true,
      expires_at: true,
      granted_by: true
    }
  });

  if (existingPrivileges.length > 0) {
    console.log('   Privilege yang sudah ada:');
    existingPrivileges.forEach(p => {
      console.log(`   - ${p.privilege} (granted: ${p.granted_at})`);
    });

    // Cek apakah sudah ada berkomunitasplus
    const hasBerkomunitasPlus = existingPrivileges.some(p => p.privilege === 'berkomunitasplus');
    if (hasBerkomunitasPlus) {
      console.log('✅ Member sudah memiliki privilege berkomunitasplus');
      return;
    }
  } else {
    console.log('   Belum ada privilege yang aktif');
  }

  // 3. Nonaktifkan privilege yang lama (jika ada)
  console.log('\n🔄 Menonaktifkan privilege lama (jika ada)...');
  
  if (existingPrivileges.length > 0) {
    const deactivatedCount = await prisma.user_privileges.updateMany({
      where: {
        clerk_id: member.clerk_id,
        is_active: true,
        privilege: { not: 'berkomunitasplus' } // Jangan nonaktifkan jika sudah berkomunitasplus
      },
      data: {
        is_active: false
      }
    });
    console.log(`   Menonaktifkan ${deactivatedCount.count} privilege lama`);
  } else {
    console.log('   Tidak ada privilege lama yang perlu dinonaktifkan');
  }

  // 4. Berikan privilege berkomunitasplus
  console.log('\n✨ Memberikan privilege berkomunitasplus...');

  const newPrivilege = await prisma.user_privileges.create({
    data: {
      clerk_id: member.clerk_id,
      privilege: 'berkomunitasplus',
      is_active: true,
      granted_by: 'script-manual-grant',
      granted_at: new Date(),
      expires_at: null // Permanent privilege
    }
  });

  console.log('✅ Privilege berkomunitasplus berhasil diberikan!');
  console.log('   Privilege ID:', newPrivilege.id);
  console.log('   Status:', newPrivilege.is_active ? 'Aktif' : 'Tidak Aktif');
  console.log('   Granted At:', newPrivilege.granted_at);
  console.log('   Expires At:', newPrivilege.expires_at || 'Permanent');

  // 5. Verifikasi privilege baru
  console.log('\n🔍 Verifikasi privilege...');
  
  const verification = await prisma.user_privileges.findFirst({
    where: {
      clerk_id: member.clerk_id,
      privilege: 'berkomunitasplus',
      is_active: true
    }
  });

  if (verification) {
    console.log('✅ Verifikasi berhasil - Privilege berkomunitasplus aktif');
    
    // Test privilege dengan helper function jika ada
    try {
      const hasPrivilege = await prisma.$queryRaw`
        SELECT user_has_privilege(${member.id}, 'berkomunitasplus') as has_privilege
      `;
      
      if (hasPrivilege[0]?.has_privilege) {
        console.log('✅ Helper function confirmed: Member memiliki privilege berkomunitasplus');
      }
    } catch (error) {
      console.log('ℹ️  Helper function tidak tersedia atau tidak berfungsi dengan schema saat ini');
    }

  } else {
    console.log('❌ Verifikasi gagal - Privilege tidak ditemukan');
  }
  console.log('\n🎉 Proses selesai!');
  console.log(`\nMember ${member.nama_lengkap || email} sekarang memiliki privilege berkomunitasplus`);
  console.log(`\nMember ${member.nama_lengkap || 'drwcorpora@gmail.com'} sekarang memiliki privilege berkomunitasplus`);
}

// Jalankan script
console.log('🎯 Script loaded, executing main function...');

grantBerkomunitaPlusPrivilege()
  .then(() => {
    console.log('\n✨ Script selesai dijalankan');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script error:', error);
    process.exit(1);
  });

export { grantBerkomunitaPlusPrivilege };