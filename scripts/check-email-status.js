// Script to check email status of all members

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEmailStatus() {
  console.log('📊 Checking email status for all members...\n');

  try {
    // Get total member count
    const totalMembers = await prisma.members.count({
      where: { google_id: { not: null } }
    });

    // Get members with emails
    const membersWithEmails = await prisma.members.count({
      where: { google_id: { not: null },
        member_emails: { some: {} }
      }
    });

    // Get members without emails
    const membersWithoutEmails = await prisma.members.count({
      where: { google_id: { not: null },
        member_emails: { none: {} }
      }
    });

    console.log('📈 Email Status Summary:');
    console.log(`   - Total members with Clerk ID: ${totalMembers}`);
    console.log(`   - Members with emails: ${membersWithEmails}`);
    console.log(`   - Members without emails: ${membersWithoutEmails}`);
    console.log(`   - Coverage: ${totalMembers > 0 ? ((membersWithEmails / totalMembers) * 100).toFixed(1) : 0}%\n`);

    // Show detailed breakdown
    if (membersWithoutEmails > 0) {
      console.log('⚠️  Members without email records:');
      const missingEmailMembers = await prisma.members.findMany({
        where: { google_id: { not: null },
          member_emails: { none: {} }
        },
        select: {
          id: true,
          google_id: true,
          nama_lengkap: true,
          tanggal_daftar: true
        },
        orderBy: { tanggal_daftar: 'desc' },
        take: 10 // Show first 10
      });

      missingEmailMembers.forEach((member, index) => {
        console.log(`   ${index + 1}. ${member.nama_lengkap || 'No name'} - ${member.clerk_id} (${member.tanggal_daftar?.toLocaleDateString() || 'No date'})`);
      });

      if (membersWithoutEmails > 10) {
        console.log(`   ... and ${membersWithoutEmails - 10} more`);
      }
    }

    // Show email distribution
    console.log('\n📧 Email Distribution:');
    const emailCounts = await prisma.member_emails.groupBy({
      by: ['clerk_id'],
      _count: { email: true },
      orderBy: { _count: { email: 'desc' } },
      take: 5
    });

    for (const emailCount of emailCounts) {
      const member = await prisma.members.findUnique({
        where: { google_id: emailCount.clerk_id },
        select: { nama_lengkap: true }
      });
      
      console.log(`   - ${member?.nama_lengkap || 'Unknown'}: ${emailCount._count.email} email(s)`);
    }

    // Show recent registrations
    console.log('\n🕒 Recent registrations (last 10):');
    const recentMembers = await prisma.members.findMany({
      where: { google_id: { not: null } },
      include: {
        member_emails: { select: { email: true, is_primary: true } }
      },
      orderBy: { tanggal_daftar: 'desc' },
      take: 10
    });

    recentMembers.forEach((member, index) => {
      const primaryEmail = member.member_emails.find(e => e.is_primary)?.email || 
                          member.member_emails[0]?.email || 
                          'No email';
      console.log(`   ${index + 1}. ${member.nama_lengkap || 'No name'} - ${primaryEmail} (${member.tanggal_daftar?.toLocaleDateString() || 'No date'})`);
    });

  } catch (error) {
    console.error('❌ Error checking email status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkEmailStatus().catch(console.error);
