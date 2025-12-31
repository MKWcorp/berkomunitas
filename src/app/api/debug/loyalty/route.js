import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the member by clerk_id
    const member = await prisma.members.findFirst({
      where: { id: user.id },
      select: {
        id: true,
        nama_lengkap: true,
        loyalty_point: true, // Field langsung dari members
        loyalty_point_history: {
          select: {
            id: true,
            point: true,
            event: true,
            created_at: true
          },
          orderBy: {
            created_at: 'desc'
          }
        }
      }
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    // Calculate total from history
    const totalFromHistory = member.loyalty_point_history.reduce((sum, history) => sum + history.point, 0);

    // Get latest few history entries for debugging
    const recentHistory = member.loyalty_point_history.slice(0, 10);

    return NextResponse.json({
      success: true,
      debug: {
        member_id: member.id,
        nama_lengkap: member.nama_lengkap,
        loyalty_from_members_table: member.loyalty_point,
        loyalty_from_history_sum: totalFromHistory,
        difference: member.loyalty_point - totalFromHistory,
        history_entries_count: member.loyalty_point_history.length,
        recent_history: recentHistory.map(h => ({
          id: h.id,
          point: h.point,
          event: h.event,
          created_at: h.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Error debugging loyalty:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}