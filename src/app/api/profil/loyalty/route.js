import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';

/**
 * GET /api/profil/loyalty
 * Fetches the loyalty points for the currently authenticated member.
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }    // Find the member by email, google_id, or clerk_id
    const member = await prisma.members.findFirst({
      where: {
        OR: [
          { email: user.email },
          { google_id: user.google_id },
          user.clerk_id ? { google_id: user.clerk_id } : { id: user.id }
        ].filter(Boolean)
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
