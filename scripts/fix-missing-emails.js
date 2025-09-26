// Script to fix users who don't have emails in member_emails table
// This can happen if they were created before webhook was properly set up

import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

async function fixMissingEmails() {
  console.log('🔍 Finding members without email records...\n');

  try {
    // Find all members with clerk_id but no emails
    const membersWithoutEmails = await prisma.members.findMany({
      where: {
        clerk_id: { not: null },
        member_emails: { none: {} }
      },
      select: {
        id: true,
        clerk_id: true,
        nama_lengkap: true,
        tanggal_daftar: true
      }
    });

    console.log(`Found ${membersWithoutEmails.length} members without email records:`);
    
    if (membersWithoutEmails.length === 0) {
      console.log('✅ All members have email records!');
      return;
    }

    let fixedCount = 0;
    let failedCount = 0;

    for (const member of membersWithoutEmails) {
      console.log(`\n🔧 Fixing member: ${member.nama_lengkap} (${member.clerk_id})`);
      
      try {
        // Get user data from Clerk
        const clerkUser = await clerkClient.users.getUser(member.clerk_id);
        
        if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
          const primaryEmail = clerkUser.primaryEmailAddress || clerkUser.emailAddresses[0];
          
          // Create email records
          const emailData = clerkUser.emailAddresses.map((emailObj) => ({
            clerk_id: member.clerk_id,
            email: emailObj.emailAddress,
            is_primary: emailObj.id === primaryEmail.id,
            verified: emailObj.verification?.status === 'verified' || false,
          }));

          await prisma.member_emails.createMany({
            data: emailData,
            skipDuplicates: true,
          });

          console.log(`   ✅ Added ${emailData.length} email(s)`);
          emailData.forEach((email, index) => {
            console.log(`      ${index + 1}. ${email.email} ${email.is_primary ? '(primary)' : ''} ${email.verified ? '(verified)' : '(unverified)'}`);
          });
          
          fixedCount++;
        } else {
          console.log('   ⚠️  No email addresses found in Clerk');
        }
        
      } catch (clerkError) {
        console.error(`   ❌ Error getting Clerk data: ${clerkError.message}`);
        failedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Members processed: ${membersWithoutEmails.length}`);
    console.log(`   - Successfully fixed: ${fixedCount}`);
    console.log(`   - Failed: ${failedCount}`);
    
    if (fixedCount > 0) {
      console.log('\n✅ Email synchronization completed!');
    }

  } catch (error) {
    console.error('❌ Error in fixMissingEmails:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixMissingEmails().catch(console.error);
