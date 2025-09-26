import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = user.id;
    const body = await request.json();
    const { target_clerk_id, action } = body; // action: 'merge' or 'link_email'

    console.log('🔄 Account merge request:', { currentUserId, target_clerk_id, action });

    if (!target_clerk_id) {
      return NextResponse.json({ 
        error: 'Target clerk ID is required' 
      }, { status: 400 });
    }

    // Prevent self-merge
    if (currentUserId === target_clerk_id) {
      return NextResponse.json({ 
        error: 'Cannot merge with yourself' 
      }, { status: 400 });
    }

    // Find target member
    const targetMember = await prisma.members.findUnique({
      where: { clerk_id: target_clerk_id },
      include: {
        member_emails: true,
        profil_sosial_media: true,
        loyalty_point_history: true
      }
    });

    if (!targetMember) {
      return NextResponse.json({ 
        error: 'Target account not found' 
      }, { status: 404 });
    }

    // Find current user's member record (if exists)
    const currentMember = await prisma.members.findUnique({
      where: { clerk_id: currentUserId },
      include: {
        member_emails: true,
        profil_sosial_media: true,
        loyalty_point_history: true
      }
    });

    let result;

    if (action === 'link_email') {
      // Link current user's email to target account
      result = await prisma.$transaction(async (tx) => {
        const userEmails = user.emailAddresses || [];
        const primaryClerkEmail = user.primaryEmailAddress?.emailAddress;

        // Add current user's emails to target account
        for (const email of userEmails) {
          // Check if email already exists
          const existingEmail = await tx.member_emails.findFirst({
            where: {
              clerk_id: target_clerk_id,
              email: email.emailAddress
            }
          });

          if (!existingEmail) {
            await tx.member_emails.create({
              data: {
                clerk_id: target_clerk_id,
                email: email.emailAddress,
                verified: email.verification?.status === 'verified',
                is_primary: email.emailAddress === primaryClerkEmail
              }
            });
          }
        }

        // If current user has a member record, delete it (they'll use target account)
        if (currentMember) {
          // Delete current user's records
          await tx.member_emails.deleteMany({
            where: { clerk_id: currentUserId }
          });
          
          await tx.profil_sosial_media.deleteMany({
            where: { id_member: currentMember.id }
          });

          await tx.members.delete({
            where: { clerk_id: currentUserId }
          });
        }

        return { action: 'email_linked', target_member: targetMember };
      });

    } else if (action === 'merge') {
      // Full account merge
      result = await prisma.$transaction(async (tx) => {
        if (currentMember) {
          // Merge loyalty points
          const currentPoints = currentMember.loyalty_point || 0;
          const targetPoints = targetMember.loyalty_point || 0;
          const totalPoints = currentPoints + targetPoints;

          await tx.members.update({
            where: { clerk_id: target_clerk_id },
            data: {
              loyalty_point: totalPoints
            }
          });

          // Transfer loyalty point history
          await tx.loyalty_point_history.updateMany({
            where: { id_member: currentMember.id },
            data: { id_member: targetMember.id }
          });

          // Transfer social media profiles (avoid duplicates)
          const currentSocial = currentMember.profil_sosial_media || [];
          const targetSocial = targetMember.profil_sosial_media || [];
          
          for (const social of currentSocial) {
            const duplicate = targetSocial.find(t => 
              t.platform === social.platform && 
              t.username_sosmed === social.username_sosmed
            );
            
            if (!duplicate) {
              await tx.profil_sosial_media.update({
                where: { id: social.id },
                data: { id_member: targetMember.id }
              });
            } else {
              // Delete duplicate from current user
              await tx.profil_sosial_media.delete({
                where: { id: social.id }
              });
            }
          }

          // Add current user's emails to target account
          const userEmails = user.emailAddresses || [];
          const primaryClerkEmail = user.primaryEmailAddress?.emailAddress;

          for (const email of userEmails) {
            const existingEmail = await tx.member_emails.findFirst({
              where: {
                clerk_id: target_clerk_id,
                email: email.emailAddress
              }
            });

            if (!existingEmail) {
              await tx.member_emails.create({
                data: {
                  clerk_id: target_clerk_id,
                  email: email.emailAddress,
                  verified: email.verification?.status === 'verified',
                  is_primary: email.emailAddress === primaryClerkEmail
                }
              });
            }
          }

          // Delete current user's member record
          await tx.member_emails.deleteMany({
            where: { clerk_id: currentUserId }
          });

          await tx.members.delete({
            where: { clerk_id: currentUserId }
          });
        }

        return { action: 'accounts_merged', target_member: targetMember, points_added: currentMember?.loyalty_point || 0 };
      });
    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Use "merge" or "link_email"' 
      }, { status: 400 });
    }

    console.log('✅ Account operation completed:', result);

    return NextResponse.json({
      success: true,
      message: action === 'merge' ? 'Akun berhasil digabungkan' : 'Email berhasil ditambahkan ke akun',
      result: result
    });

  } catch (error) {
    console.error('❌ Account merge error:', error);
    return NextResponse.json({ 
      error: 'Gagal menggabungkan akun: ' + error.message 
    }, { status: 500 });
  }
}
