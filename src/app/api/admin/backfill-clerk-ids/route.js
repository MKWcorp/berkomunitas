import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import prisma from '@/utils/prisma';

/**
 * GET /api/admin/backfill-clerk-ids
 * A one-time script to populate the `clerkId` for existing members in the database.
 * This script fetches all users from Clerk and all members from the local DB,
 * matches them by email, and updates the member record with the correct clerkId.
 * 
 * To run, visit this URL in your browser or use a tool like Postman.
 * For security, this should only be run once and then the file can be deleted.
 * It's protected by a simple secret query parameter.
 * 
 * Example URL: /api/admin/backfill-clerk-ids?secret=YOUR_SECRET_KEY
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Simple security check to prevent unauthorized execution.
  // Replace 'ganti-dengan-secret-anda' with a random, hard-to-guess string.
  if (secret !== process.env.BACKFILL_SECRET && secret !== 'ganti-dengan-secret-anda') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch all users from Clerk. The API is paginated.
    const clerkUsersList = await clerkClient.users.getUserList({ limit: 500 }); // Adjust limit as needed

    // 2. Fetch all local members where clerk_id is NULL
    const localMembers = await prisma.members.findMany({
      where: {
        clerk_id: null,
      },
    });

    // Create a map for easy lookup by email
    const membersByEmail = new Map(localMembers.map(member => [member.email.toLowerCase(), member]));

    let updatedCount = 0;
    const updatePromises = [];

    // 3. Iterate through Clerk users and find matches
    for (const clerkUser of clerkUsersList) {
      const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress;
      if (!primaryEmail) continue;

      const memberToUpdate = membersByEmail.get(primaryEmail.toLowerCase());

      if (memberToUpdate) {
        // If a match is found and clerk_id is null, prepare the update
        updatePromises.push(
          prisma.members.update({
            where: { id: memberToUpdate.id },
            data: { clerk_id: clerkUser.id },
          })
        );
        updatedCount++;
      }
    }

    // 4. Execute all updates in a single transaction
    if (updatePromises.length > 0) {
      await prisma.$transaction(updatePromises);
    }

    return NextResponse.json({
      success: true,
      message: 'Backfill completed successfully.',
      totalClerkUsers: clerkUsersList.length,
      totalLocalMembersWithoutClerkId: localMembers.length,
      membersUpdated: updatedCount,
    });

  } catch (error) {
    console.error('Error during backfill process:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
