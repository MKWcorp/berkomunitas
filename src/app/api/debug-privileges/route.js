import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '../../../../lib/prisma';

// Debug endpoint to check user privileges
export async function GET() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ 
        error: 'No user authenticated',
        user: null 
      });
    }

    // Get member data with detailed info
    const member = await prisma.members.findUnique({
      where: { clerk_id: user.id },
      include: { 
        user_privileges: true,
        member_emails: true
      }
    });

    return NextResponse.json({
      user_id: user.id,
      user_email: user.primaryEmailAddress?.emailAddress,
      member_found: !!member,
      member_id: member?.id,
      member_email: member?.email,
      user_privileges_exists: !!member?.user_privileges,
      user_privileges: member?.user_privileges,
      is_admin: member?.user_privileges?.is_admin,
      all_emails: member?.member_emails?.map(e => ({ email: e.email, is_primary: e.is_primary, verified: e.verified }))
    });

  } catch (error) {
    console.error('Debug privileges error:', error);
    return NextResponse.json({ 
      error: 'Debug error',
      details: error.message 
    });
  }
}
