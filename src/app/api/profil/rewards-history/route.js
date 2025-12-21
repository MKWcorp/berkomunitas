import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
export async function GET(request) {
  try {
    // Check authentication
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First, get the member record to find the member_id
    const member = await prisma.members.findFirst({
      where: { id: user.id },
      select: {
        id: true
      }
    });

    if (!member) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        message: 'Member record not found'
      });
    }

    // Fetch rewards redemption history for the current user
    const rewardsHistory = await prisma.reward_redemptions.findMany({
      where: {
        id_member: member.id
      },
      include: {
        rewards: {
          select: {
            id: true,
            reward_name: true,
            foto_url: true,
            point_cost: true,
            description: true
          }
        }
      },
      orderBy: [
        { redeemed_at: 'desc' }
      ]
    });

    // Format the data
    const formattedHistory = rewardsHistory.map(redemption => ({
      id: redemption.id,
      quantity: redemption.quantity,
      points_spent: redemption.points_spent,
      status: redemption.status,
      redeemed_at: redemption.redeemed_at?.toISOString(),
      shipped_at: redemption.shipped_at?.toISOString(),
      delivered_at: redemption.delivered_at?.toISOString(),
      shipping_notes: redemption.shipping_notes,
      redemption_notes: redemption.redemption_notes,
      reward: redemption.rewards ? {
        id: redemption.rewards.id,
        reward_name: redemption.rewards.reward_name,
        foto_url: redemption.rewards.foto_url,
        point_cost: redemption.rewards.point_cost,
        description: redemption.rewards.description
      } : null
    }));

    return NextResponse.json({
      success: true,
      data: formattedHistory,
      total: formattedHistory.length
    });

  } catch (error) {
    console.error('Error fetching rewards history:', error);
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