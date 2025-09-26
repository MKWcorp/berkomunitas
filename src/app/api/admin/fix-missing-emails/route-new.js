import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    // Validate environment variables
    if (!process.env.CLERK_SECRET_KEY) {
      console.error('CLERK_SECRET_KEY is missing');
      return NextResponse.json({
        success: false,
        error: 'Clerk configuration is missing - CLERK_SECRET_KEY not found'
      }, { status: 500 });
    }

    const { action = 'check' } = await req.json();

    // Get all members without emails
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

    console.log(`Found ${membersWithoutEmails.length} members without emails`);

    if (action === 'check') {
      return NextResponse.json({
        success: true,
        message: `Found ${membersWithoutEmails.length} members without emails`,
        members: membersWithoutEmails
      });
    }

    if (action === 'fix') {
      const results = [];
      
      // Test Clerk connection first
      try {
        console.log('🧪 Testing Clerk connection...');
        if (!clerkClient || typeof clerkClient.users?.getUser !== 'function') {
          throw new Error('Clerk client not properly initialized or users API not available');
        }
        console.log('✅ Clerk client is available');
      } catch (testError) {
        console.error('❌ Clerk test failed:', testError);
        return NextResponse.json({
          success: false,
          error: `Clerk initialization error: ${testError.message}`
        }, { status: 500 });
      }
      
      for (const member of membersWithoutEmails) {
        try {
          console.log(`🔍 Processing: ${member.nama_lengkap} (${member.clerk_id})`);
          
          // Get user data from Clerk with detailed error handling
          let clerkUser;
          try {
            clerkUser = await clerkClient.users.getUser(member.clerk_id);
            console.log(`   ✅ Clerk data retrieved for ${member.nama_lengkap}`);
          } catch (clerkError) {
            console.error(`   ❌ Clerk API error for ${member.nama_lengkap}:`, {
              status: clerkError.status,
              message: clerkError.message,
              code: clerkError.code,
              clerkId: member.clerk_id
            });
            
            let errorMessage;
            if (clerkError.status === 404) {
              errorMessage = `User not found in Clerk (${member.clerk_id})`;
            } else if (clerkError.status === 401) {
              errorMessage = 'Clerk authentication failed - check API key';
            } else if (clerkError.status === 429) {
              errorMessage = 'Rate limit exceeded';
            } else {
              errorMessage = `Clerk API error: ${clerkError.message || 'Unknown error'}`;
            }
            throw new Error(errorMessage);
          }
          
          if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
            console.log(`   📧 Found ${clerkUser.emailAddresses.length} email(s)`);
            
            // Find primary email
            const primaryEmailInfo = clerkUser.emailAddresses.find(e => 
              e.id === clerkUser.primaryEmailAddressId
            ) || clerkUser.emailAddresses[0];
            
            console.log(`   🎯 Primary email: ${primaryEmailInfo.emailAddress}`);
            
            // Create email records
            const emailsToCreate = clerkUser.emailAddresses.map((emailObj) => ({
              clerk_id: member.clerk_id,
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
              clerk_id: member.clerk_id,
              status: 'success',
              emails_added: emailsToCreate.length,
              primary_email: primaryEmailInfo.emailAddress
            });
            
            console.log(`   ✅ SUCCESS: Added ${emailsToCreate.length} email(s)`);
          } else {
            results.push({
              member_id: member.id,
              nama_lengkap: member.nama_lengkap,
              clerk_id: member.clerk_id,
              status: 'no_email_in_clerk',
              emails_added: 0
            });
            
            console.log(`   ⚠️  No emails found in Clerk for ${member.nama_lengkap}`);
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`   💥 ERROR processing ${member.nama_lengkap}:`, error.message);
          results.push({
            member_id: member.id,
            nama_lengkap: member.nama_lengkap,
            clerk_id: member.clerk_id,
            status: 'error',
            error: error.message,
            emails_added: 0
          });
        }
      }

      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      const noEmailCount = results.filter(r => r.status === 'no_email_in_clerk').length;

      console.log(`📊 Summary: ${successCount} success, ${errorCount} errors, ${noEmailCount} no emails`);

      return NextResponse.json({
        success: true,
        message: `Processed ${results.length} members`,
        summary: {
          total_processed: results.length,
          emails_fixed: successCount,
          errors: errorCount,
          no_email_in_clerk: noEmailCount
        },
        results
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "check" or "fix"'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Main error in fix-missing-emails:', error);
    return NextResponse.json({
      success: false,
      error: `Server error: ${error.message}`
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
