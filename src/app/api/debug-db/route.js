import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No userId found' }, { status: 401 });
    }

    // Check if member exists with this clerk_id
    const member = await prisma.members.findUnique({
      where: { clerk_id: userId }
    });

    // Check user privileges
    const privileges = await prisma.user_privileges.findMany({
      where: {
        clerk_id: userId,
        is_active: true,
      }
    });

    // Get all members to see what clerk_ids exist
    const allMembers = await prisma.members.findMany({
      select: { id: true, email: true, clerk_id: true, nama_lengkap: true }
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
