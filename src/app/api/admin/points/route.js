import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';

// GET - Fetch loyalty point history with member details (Admin only)
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privilege
    const adminPrivilege = await prisma.user_privileges.findFirst({
      where: { member_id: user.id,
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const eventType = searchParams.get('eventType') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause for filtering
    let whereClause = {};
    
    if (search) {
      whereClause.members = {
        nama_lengkap: {
          contains: search,
          mode: 'insensitive'
        }
      };
    }

    if (eventType) {
      whereClause.event_type = eventType;
    }

    if (startDate || endDate) {
      whereClause.created_at = {};
      if (startDate) {
        whereClause.created_at.gte = new Date(startDate);
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        whereClause.created_at.lte = endOfDay;
      }
    }

    // Fetch loyalty point history with member details
    const history = await prisma.loyalty_point_history.findMany({
      where: whereClause,
      include: {
        members: {
          select: {
            nama_lengkap: true,
            google_id: true,
            member_emails: {
              select: {
                email: true
              },
              take: 1
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 100 // Limit to recent 100 records for performance
    });    // Also fetch all members for the dropdown
    const members = await prisma.members.findMany({
      select: {
        id: true,
        nama_lengkap: true,
        google_id: true,
        loyalty_point: true,
        member_emails: {
          select: {
            email: true
          },
          take: 1
        }
      },
      orderBy: {
        nama_lengkap: 'asc'
      }
    });

    // Fetch member statistics for the loyalty points table
    const memberStats = await prisma.members.findMany({
      select: {
        id: true,
        nama_lengkap: true,
        loyalty_point: true,
        _count: {
          select: {
            task_submissions: {
              where: {
                status_submission: 'selesai'
              }
            }
          }
        }
      },
      orderBy: {
        loyalty_point: 'desc'
      }
    });

    // Get comment counts for each member
    const memberStatsWithComments = await Promise.all(
      memberStats.map(async (member) => {
        const commentCount = await prisma.comments.count({
          where: {
            id_member: member.id
          }
        });

        return {
          id: member.id,
          nama_lengkap: member.nama_lengkap,
          loyalty_point: member.loyalty_point,
          jumlah_komentar: commentCount,
          jumlah_tugas_selesai: member._count.task_submissions
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        history,
        members,
        memberStats: memberStatsWithComments
      }
    });

  } catch (error) {
    console.error('Error fetching loyalty point data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
