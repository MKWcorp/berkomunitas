import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';
import { createRewardRedemptionNotification } from '../../../../../lib/rewardNotifications.js';

export async function POST(request) {
  try {
    // 1. Authentication check
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { _error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // 2. Parse input
    const body = await request.json();
    const { rewardId, quantity = 1, shipping_notes } = body;

    if (!rewardId) {
      return NextResponse.json(
        { error: 'rewardId is required' },
        { status: 400 }
      );
    }

    // Validate quantity
    const quantityInt = parseInt(quantity);
    if (isNaN(quantityInt) || quantityInt < 1 || quantityInt > 10) {
      return NextResponse.json(
        { error: 'Invalid quantity. Must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Convert to integer for safety
    const rewardIdInt = parseInt(rewardId);
    if (isNaN(rewardIdInt)) {
      return NextResponse.json(
        { error: 'Invalid rewardId format' },
        { status: 400 }
      );
    }

    // 3. Database Transaction - All operations must succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // 4a. Fetch & Lock Data - Get member and reward data within transaction
      
      // Get member data with FOR UPDATE lock using raw query for data integrity
      const memberData = await tx.$queryRaw`
        SELECT id, clerk_id, nama_lengkap, loyalty_point, coin
        FROM members 
        WHERE clerk_id = ${userId} 
        FOR UPDATE
      `;

      if (!memberData || memberData.length === 0) {
        throw new Error('Member not found');
      }

      const member = memberData[0];

      // Get user's privilege from user_privileges table
      const userPrivilege = await tx.user_privileges.findFirst({
        where: { member_id: user.id,
          is_active: true 
        },
        select: {
          privilege: true
        }
      });

      // Add privilege to member data
      member.privilege = userPrivilege?.privilege || 'user';

      // Get reward data with FOR UPDATE lock
      const rewardData = await tx.$queryRaw`
        SELECT id, reward_name, description, point_cost, stock, is_active, required_privilege
        FROM rewards 
        WHERE id = ${rewardIdInt} 
        FOR UPDATE
      `;

      if (!rewardData || rewardData.length === 0) {
        throw new Error('Reward not found');
      }

      const reward = rewardData[0];

      // 4b. Validation checks
      if (!reward.is_active) {
        throw new Error('This reward is no longer available');
      }

      // Check privilege requirement - use hierarchical checking
      if (reward.required_privilege && reward.required_privilege !== 'user') {
        const privilegeHierarchy = {
          'user': 1,
          'berkomunitasplus': 2,
          'partner': 3,
          'admin': 4
        };
        
        const userLevel = privilegeHierarchy[member.privilege] || 1;
        const requiredLevel = privilegeHierarchy[reward.required_privilege] || 1;
        
        if (userLevel < requiredLevel) {
          const privilegeNames = {
            'berkomunitasplus': 'BerkomunitasPlus',
            'partner': 'Partner', 
            'admin': 'Admin'
          };
          const requiredName = privilegeNames[reward.required_privilege] || reward.required_privilege;
          throw new Error(`This reward requires ${requiredName} membership or higher`);
        }
      }

      if (reward.stock < quantityInt) {
        throw new Error(`Insufficient stock. Available: ${reward.stock}, Requested: ${quantityInt}`);
      }

      const totalCost = reward.point_cost * quantityInt;
      if (member.coin < totalCost) {
        throw new Error(`Insufficient coins. You need ${totalCost} coins but only have ${member.coin} coins`);
      }

      // 4c. Get member info for response (poin akan diupdate otomatis oleh trigger)
      const _memberInfo = {
        id: member.id,
        nama_lengkap: member.nama_lengkap,
      };

      // 4d. Update Reward's Stock - Decrease stock by quantity
      const updatedReward = await tx.rewards.update({
        where: { id: reward.id },
        data: {
          stock: reward.stock - quantityInt,
        },
        select: {
          id: true,
          reward_name: true,
          stock: true,
        }
      });

      // 4e. Log Redemption History
      const redemptionRecord = await tx.reward_redemptions.create({
        data: {
          id_member: member.id,
          id_reward: reward.id,
          points_spent: totalCost,
          quantity: quantityInt,
          shipping_notes: shipping_notes ? shipping_notes.substring(0, 500) : null, // Limit to 500 chars
          redeemed_at: new Date(),
          status: 'menunggu_verifikasi', // Changed from 'pending' to match new workflow
        },
        select: {
          id: true,
          points_spent: true,
          redeemed_at: true,
          status: true,
        }
      });

      // 4f. Log Point History - Only for record keeping (loyalty_point stays the same)
      const pointHistoryRecord = await tx.loyalty_point_history.create({
        data: {
          member_id: member.id,
          event: `Penukaran Hadiah: ${reward.reward_name}${quantityInt > 1 ? ` (${quantityInt}x)` : ''}`,
          point: -totalCost, // Record the cost for history
          event_type: 'reward_redemption',
          created_at: new Date(),
        },
        select: {
          id: true,
          event: true,
          point: true,
          created_at: true,
        }
      });

      // 4g. Deduct coins (not loyalty points) - Coins are spendable, loyalty points are permanent
      await tx.members.update({
        where: { id: member.id },
        data: {
          coin: { decrement: totalCost }
        }
      });

      // Get updated member info after coin deduction
      const updatedMember = await tx.members.findUnique({
        where: { id: member.id },
        select: {
          id: true,
          loyalty_point: true,
          coin: true,
          nama_lengkap: true,
        }
      });

      // Return transaction results
      return {
        member: updatedMember,
        reward: {
          id: reward.id,
          reward_name: reward.reward_name,
          description: reward.description,
          point_cost: reward.point_cost,
          quantity: quantityInt,
          total_cost: totalCost,
          remaining_stock: updatedReward.stock,
        },
        redemption: redemptionRecord,
        point_history: pointHistoryRecord,
      };
    });

    // 5. Send notification to member
    await createRewardRedemptionNotification({
      memberId: result.member.id,
      rewardName: result.reward.reward_name
    });

    // 6. Success Response
    return NextResponse.json({
      success: true,
      message: 'Reward redeemed successfully!',
      data: {
        redemption_id: result.redemption.id,
        reward_name: result.reward.reward_name,
        quantity: result.reward.quantity,
        points_spent: result.redemption.points_spent,
        remaining_points: result.member.loyalty_point,
        remaining_coins: result.member.coin,
        redeemed_at: result.redemption.redeemed_at,
        transaction_details: {
          member_id: result.member.id,
          member_name: result.member.nama_lengkap,
          reward_id: result.reward.id,
          point_history_id: result.point_history.id,
        }
      }
    });

  } catch (___error) {
    console.error('POST /api/rewards/redeem error:', ___error);
    
    // Handle specific error types
    if (___error.message.includes('Member not found')) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }
    
    if (___error.message.includes('Reward not found')) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      );
    }
    
    if (___error.message.includes('out of stock') || 
        ___error.message.includes('no longer available') || 
        ___error.message.includes('Insufficient loyalty points')) {
      return NextResponse.json(
        { error: ___error.message },
        { status: 400 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { error: 'Internal server error during redemption' },
      { status: 500 }
    );
  }
}

// Optional: GET method to fetch available rewards for the user
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get user's current loyalty points and coins
    const member = await prisma.members.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        nama_lengkap: true,
        loyalty_point: true,
        coin: true,
      }
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Get user's privilege from user_privileges table
    const userPrivilege = await prisma.user_privileges.findFirst({
      where: { member_id: user.id,
        is_active: true 
      },
      select: {
        privilege: true
      }
    });

    // Add privilege to member data
    member.privilege = userPrivilege?.privilege || 'user';
    
    // Get available rewards
    const rewards = await prisma.rewards.findMany({
      where: {
        is_active: true,
        stock: {
          gt: 0, // Greater than 0
        }
      },
      select: {
        id: true,
        reward_name: true,
        description: true,
        point_cost: true,
        stock: true,
        foto_url: true,
        category_id: true,
        required_privilege: true,
        created_at: true,
      },
      orderBy: {
        point_cost: 'asc', // Order by cost ascending
      }
    });    // Add affordability information (based on coins, not loyalty points)
    const rewardsWithAffordability = rewards.map(reward => ({
      ...reward,
      is_affordable: (member.coin || 0) >= reward.point_cost,
      coins_needed: Math.max(0, reward.point_cost - (member.coin || 0)),
    }));

    return NextResponse.json({
      success: true,
      data: {
        member: {
          id: member.id,
          nama_lengkap: member.nama_lengkap,
          loyalty_point: member.loyalty_point,
          coin: member.coin || 0,
          privilege: member.privilege,
        },
        rewards: rewardsWithAffordability,
        stats: {
          total_rewards: rewards.length,
          affordable_rewards: rewardsWithAffordability.filter(r => r.is_affordable).length,
        }
      }
    });

  } catch (error) {
    console.error('GET /api/rewards/redeem error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
