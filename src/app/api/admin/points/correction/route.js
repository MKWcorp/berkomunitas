import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '../../../../../utils/prisma';

// POST - Manual point correction (Admin only)
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privilege
    const adminPrivilege = await prisma.user_privileges.findFirst({
      where: {
        clerk_id: userId,
        privilege: 'admin',
        is_active: true,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ]
      }
    });

    if (!adminPrivilege) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { memberId, pointValue, reason } = await request.json();

    // Validate input
    if (!memberId || pointValue === undefined || !reason) {
      return NextResponse.json(
        { error: 'memberId, pointValue, and reason are required' },
        { status: 400 }
      );
    }

    if (typeof pointValue !== 'number') {
      return NextResponse.json(
        { error: 'pointValue must be a number' },
        { status: 400 }
      );
    }

    // Verify member exists
    const member = await prisma.members.findUnique({
      where: { id: parseInt(memberId) },
      select: { id: true, nama_lengkap: true }
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Execute point correction in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Insert into loyalty_point_history
      // The database trigger will automatically update the total points
      const historyRecord = await tx.loyalty_point_history.create({
        data: {
          member_id: parseInt(memberId),
          event: reason,
          point: pointValue,
          event_type: 'admin_correction',
          created_at: new Date()
        },
        select: {
          id: true,
          event: true,
          point: true,
          created_at: true
        }
      });

      return historyRecord;
    });

    return NextResponse.json({
      success: true,
      message: `Koreksi poin berhasil dilakukan untuk ${member.nama_lengkap}. ${pointValue > 0 ? 'Menambahkan' : 'Mengurangi'} ${Math.abs(pointValue)} poin.`,
      data: {
        historyRecord: result,
        memberName: member.nama_lengkap,
        pointChange: pointValue
      }
    });

  } catch (error) {
    console.error('Error processing point correction:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
