import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    // Validate environment variables
    if (!process.env.CLERK_SECRET_KEY) {
      console.error('CLERK_SECRET_KEY is missing');
      return NextResponse.json({
        success: false,
        error: 'Clerk configuration is missing'
      }, { status: 500 });
    }

    // Create Clerk client instance
    const clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });

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
      
      for (const member of membersWithoutEmails) {        try {          console.log(`🔍 Fetching Clerk data for ${member.nama_lengkap} (${member.clerk_id})`);
          // Verify clerk instance is available
          if (!clerk || !clerk.users) {
            throw new Error('Clerk client not properly initialized');
          }
          
          // Get user data from Clerk
          const clerkUser = await clerk.users.getUser(member.clerk_id);
          
          if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
            // Find primary email
            const primaryEmailInfo = clerkUser.emailAddresses.find(e => 
              e.id === clerkUser.primaryEmailAddressId
            ) || clerkUser.emailAddresses[0];
            
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
            
            console.log(`✅ Fixed emails for ${member.nama_lengkap}: ${emailsToCreate.length} email(s)`);
          } else {
            results.push({
              member_id: member.id,
              nama_lengkap: member.nama_lengkap,
              clerk_id: member.clerk_id,
              status: 'no_email_in_clerk',
              emails_added: 0
            });
            
            console.log(`❌ No emails found in Clerk for ${member.nama_lengkap}`);
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Error processing ${member.nama_lengkap}:`, error);
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
    console.error('Error in fix-missing-emails:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
