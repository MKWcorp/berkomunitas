const { PrismaClient } = require('@prisma/client');
const { clerkClient } = require('@clerk/nextjs/server');

const prisma = new PrismaClient();

async function fixMissingEmails() {
  try {
    // Get all members without emails
    const membersWithoutEmails = await prisma.members.findMany({
      where: { google_id: { not: null },
        member_emails: { none: {} }
      },
      select: {
        id: true,
        google_id: true,
        nama_lengkap: true,
        tanggal_daftar: true
      }
    });

    console.log(`🔍 Found ${membersWithoutEmails.length} members without emails`);

    const results = [];
    
    for (const member of membersWithoutEmails) {
      try {
        console.log(`\n📋 Processing ${member.nama_lengkap} (${member.clerk_id})`);
        
        // Get user data from Clerk
        const clerkUser = await clerkClient.users.getUser(member.clerk_id);
        
        if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
          // Find primary email
          const primaryEmailInfo = clerkUser.emailAddresses.find(e => 
            e.id === clerkUser.primaryEmailAddressId
          ) || clerkUser.emailAddresses[0];
          
          console.log(`   📧 Found ${clerkUser.emailAddresses.length} email(s)`);
          console.log(`   🎯 Primary: ${primaryEmailInfo.emailAddress}`);
          
          // Create email records
          const emailsToCreate = clerkUser.emailAddresses.map((emailObj) => ({
            google_id: member.clerk_id,
            email: emailObj.emailAddress,
            is_primary: emailObj.id === primaryEmailInfo.id,
            verified: emailObj.verification?.status === 'verified' || false,
          }));

          await prisma.member_emails.createMany({
            data: emailsToCreate,
            skipDuplicates: true,
          });

          results.push({
            member_id: member.id,
            nama_lengkap: member.nama_lengkap,
            google_id: member.clerk_id,
            status: 'success',
            emails_added: emailsToCreate.length,
            primary_email: primaryEmailInfo.emailAddress
          });
          
          console.log(`   ✅ Success: Added ${emailsToCreate.length} email(s)`);
        } else {
          results.push({
            member_id: member.id,
            nama_lengkap: member.nama_lengkap,
            google_id: member.clerk_id,
            status: 'no_email_in_clerk',
            emails_added: 0
          });
          
          console.log(`   ❌ No emails found in Clerk`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`   💥 Error processing ${member.nama_lengkap}:`, error.message);
        results.push({
          member_id: member.id,
          nama_lengkap: member.nama_lengkap,
          google_id: member.clerk_id,
          status: 'error',
          error: error.message,
          emails_added: 0
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const noEmailCount = results.filter(r => r.status === 'no_email_in_clerk').length;

    console.log(`\n📊 Summary:`);
    console.log(`   Total processed: ${results.length}`);
    console.log(`   ✅ Emails fixed: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   🚫 No email in Clerk: ${noEmailCount}`);

    // Show successful fixes
    const successResults = results.filter(r => r.status === 'success');
    if (successResults.length > 0) {
      console.log(`\n🎉 Successfully fixed emails for:`);
      successResults.forEach(result => {
        console.log(`   - ${result.nama_lengkap}: ${result.primary_email}`);
      });
    }

    // Show errors
    const errorResults = results.filter(r => r.status === 'error');
    if (errorResults.length > 0) {
      console.log(`\n⚠️  Errors occurred for:`);
      errorResults.forEach(result => {
        console.log(`   - ${result.nama_lengkap}: ${result.error}`);
      });
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingEmails();
