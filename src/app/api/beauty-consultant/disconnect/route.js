import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/utils/prisma';

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get member data
    const member = await prisma.members.findUnique({
      where: { user_id: userId }
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check if member has an active connection
    const connection = await prisma.bc_drwskincare_plus.findUnique({
      where: { member_id: member.id },
      include: {
        bc_drwskincare_plus_verified: true
      }
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'No active connection found' },
        { status: 404 }
      );
    }

    // Delete verified data first (due to foreign key constraint)
    if (connection.bc_drwskincare_plus_verified) {
      await prisma.bc_drwskincare_plus_verified.delete({
        where: { connection_id: connection.id }
      });
      console.log('✅ Deleted verified data for connection:', connection.id);
    }

    // Delete the connection
    await prisma.bc_drwskincare_plus.delete({
      where: { id: connection.id }
    });
    console.log('✅ Deleted connection:', connection.id);

    // Update member privilege back to regular
    await prisma.member_privileges.updateMany({
      where: { member_id: member.id },
      data: { 
        privilege_type: 'berkomunitas',
        updated_at: new Date()
      }
    });
    console.log('✅ Updated privilege back to regular for member:', member.id);

    return NextResponse.json({
      success: true,
      message: 'Beauty Consultant connection successfully disconnected'
    });

  } catch (error) {
    console.error('POST /api/beauty-consultant/disconnect error:', error);
    
    return NextResponse.json(
      { error: 'Failed to disconnect Beauty Consultant account' },
      { status: 500 }
    );
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.warn('Warning: Failed to disconnect Prisma client:', disconnectError.message);
    }
  }
}