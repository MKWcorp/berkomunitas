import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'No userId found' }, { status: 401 });
    }

    // Check if member exists with this clerk_id
    const member = await prisma.members.findUnique({
      where: { id: user.id }
    });

    // Check user privileges
    const privileges = await prisma.user_privileges.findMany({
      where: { id: user.id,
        is_active: true,
      }
    });

    // Get all members to see what clerk_ids exist
    const allMembers = await prisma.members.findMany({
      select: { id: true, email: true, google_id: true, nama_lengkap: true }
    });

    return NextResponse.json({
      currentUserId: userId,
      memberExists: !!member,
      member: member,
      privileges: privileges,
      allMembers: allMembers,
      totalMembers: allMembers.length
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
