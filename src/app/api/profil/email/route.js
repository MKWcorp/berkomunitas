import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profil/email
 * Get user's email from Clerk
 */
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.emailAddresses?.[0]?.emailAddress || '';

    return NextResponse.json({ 
      success: true, 
      email: email 
    });

  } catch (error) {
    console.error('Error fetching user email:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
