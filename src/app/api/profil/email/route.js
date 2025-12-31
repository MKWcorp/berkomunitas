import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profil/email
 * Get user's email from Clerk
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.email || '';

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
