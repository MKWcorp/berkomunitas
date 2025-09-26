import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '../../../../../lib/prisma';

/**
 * GET /api/profil/loyalty
 * Fetches the loyalty points for the currently authenticated member.
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Clerk's auth() doesn't directly give us the email on the server-side for API routes.
    // A common pattern is to have the user's email stored in your own database
    // linked by the clerk userId, or to fetch it if needed.
    // For this case, we'll assume the user's profile is in our DB and can be found.
    // Let's find the user via Clerk's own API first to get their email.
    // Note: This requires the Clerk Backend SDK. For simplicity, we'll assume
    // the email is already in our `members` table, linked from when the user was created.
    // A more robust solution would be to query Clerk's API if the email isn't found.
    
    // Let's find the member by their clerk_id if it's stored.
    // Assuming you have a 'clerkId' field on your Member model.
    // If not, we'll have to rely on the email which we don't have here directly.
    // Let's adjust the logic to expect the email to be passed from the client,
    // or even better, let's assume the `members` table has a `clerkId`.
    
    // A practical approach is to find the user by their clerkId.
    // Let's assume your `members` table has a field `clerkId` that stores the `userId` from Clerk.
    const member = await prisma.members.findUnique({
      where: {
        clerk_id: userId, // Menggunakan clerk_id sesuai schema yang baru
      },
      select: {
        loyalty_point: true,
        coin: true,
      },
    });

    if (!member) {
      // If the member is not found by clerkId, it might be a new user who hasn't been synced yet.
      // Returning 0 points is a safe default.
      return NextResponse.json({ success: true, loyalty_point: 0, coin: 0 });
    }

    return NextResponse.json({
      success: true,
      loyalty_point: Number(member.loyalty_point) || 0, // Ensure BigInt is converted
      coin: Number(member.coin) || 0, // Ensure BigInt is converted
    });

  } catch (error) {
    console.error('Error fetching loyalty points:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
