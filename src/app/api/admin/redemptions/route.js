import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../utils/prisma";

export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const whereClause = statusFilter ? { status: statusFilter } : {};

    const redemptions = await prisma.reward_redemptions.findMany({
      where: whereClause,
      include: {
        rewards: {
          select: {
            id: true,
            reward_name: true,
            point_cost: true
          }
        },
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            nomer_wa: true
          }
        }
      },
      orderBy: { redeemed_at: 'desc' }
    });

    const transformedRedemptions = redemptions.map(redemption => ({
      ...redemption,
      reward_name: redemption.rewards?.reward_name || 'Hadiah tidak diketahui',
      point_cost: redemption.rewards?.point_cost || 0,
      member_name: redemption.members?.nama_lengkap || 'User tidak diketahui',
      member_wa: redemption.members?.nomer_wa || 'Tidak tersedia',
      quantity: redemption.quantity || 1
    }));

    return NextResponse.json({
      success: true,
      data: transformedRedemptions,
      count: transformedRedemptions.length
    });

  } catch (error) {
    console.error('Error fetching redemption history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch redemption history' },
      { status: 500 }
    );
  }
}
