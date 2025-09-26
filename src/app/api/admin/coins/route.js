import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Get user email from headers for admin verification
    const userEmail = request.headers.get('x-user-email');
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email header is required' },
        { status: 401 }
      );
    }

    // Check if user is admin - simplified for now
    // TODO: Implement proper admin check
    /*
    const adminUser = await prisma.admin_users.findUnique({
      where: { email: userEmail }
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Access denied: Admin privileges required' },
        { status: 403 }
      );
    }
    */

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const eventType = searchParams.get('eventType') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    // Build where conditions for history
    let historyWhere = {};
    if (search) {
      historyWhere = {
        ...historyWhere,
        members: {
          nama_lengkap: {
            contains: search,
            mode: 'insensitive'
          }
        }
      };
    }
    if (eventType) {
      historyWhere = {
        ...historyWhere,
        event_type: eventType
      };
    }
    if (startDate || endDate) {
      historyWhere = {
        ...historyWhere,
        created_at: {}
      };
      if (startDate) {
        historyWhere.created_at.gte = new Date(startDate);
      }
      if (endDate) {
        historyWhere.created_at.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // Get coin history with member information
    const history = await prisma.coin_history.findMany({
      where: historyWhere,
      include: {
        members: {
          select: {
            id: true,
            nama_lengkap: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 1000 // Limit to prevent performance issues
    });

    // Format history data
    const formattedHistory = history.map(item => ({
      id: item.id,
      member_id: item.member_id,
      member_name: item.members?.nama_lengkap || 'Unknown Member',
      coin: item.coin,
      event: item.event,
      event_type: item.event_type,
      created_at: item.created_at
    }));

    // Get all members with their current coin balance
    const members = await prisma.members.findMany({
      select: {
        id: true,
        nama_lengkap: true,
        coin: true
      },
      orderBy: {
        coin: 'desc'
      }
    });

    // Use all members for member statistics instead of filtering by coin_history
    const memberStats = members;

    // Calculate summary statistics
    const totalCoins = members.reduce((sum, member) => sum + (member.coin || 0), 0);
    const totalMembers = members.length;
    const averageCoins = totalMembers > 0 ? Math.round(totalCoins / totalMembers) : 0;

    return NextResponse.json({
      success: true,
      data: {
        history: formattedHistory,
        members: members,
        memberStats: memberStats,
        summary: {
          totalCoins,
          totalMembers,
          averageCoins
        }
      }
    });

  } catch (error) {
    console.error('Error in coins API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}