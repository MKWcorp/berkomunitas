import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
// import { createRewardStatusNotification } from '../../../../../../../lib/rewardNotifications.js';

export async function POST(request, { params }) {
  try {
    // Check authentication
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { redemption_notes } = body;

    // First, get the member record
    const member = await prisma.members.findFirst({
      where: { id: user.id },
      select: {
        id: true
      }
    });

    if (!member) {
      return NextResponse.json({
        success: false,
        error: 'Member record not found'
      }, { status: 404 });
    }

    // Use transaction for the confirmation
    const result = await prisma.$transaction(async (tx) => {
      // Get current redemption data first
      const currentRedemption = await tx.reward_redemptions.findFirst({
        where: { 
          id: parseInt(id),
          id_member: member.id // Ensure user owns this redemption
        },
        include: {
          members: {
            select: {
              id: true,
              nama_lengkap: true,
              nomer_wa: true,
            }
          },
          rewards: {
            select: {
              id: true,
              reward_name: true,
              point_cost: true,
            }
          }
        }
      });

      if (!currentRedemption) {
        throw new Error('Redemption not found or access denied');
      }

      // Check if status is "dikirim"
      if (currentRedemption.status !== 'dikirim') {
        throw new Error('Konfirmasi hanya dapat dilakukan untuk status "Dikirim"');
      }

      // Update the redemption status to "diterima" 
      const updateData = {
        status: 'diterima', // Explicitly set to "diterima"
        delivered_at: new Date(),
        redemption_notes: redemption_notes || currentRedemption.redemption_notes // User's review/notes
      };

      console.log('Updating redemption with data:', updateData);
      console.log('Current status:', currentRedemption.status, '-> New status: diterima');

      // Ensure shipped_at is set if not already
      if (!currentRedemption.shipped_at) {
        updateData.shipped_at = new Date();
      }

      const updatedRedemption = await tx.reward_redemptions.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          members: {
            select: {
              nama_lengkap: true,
              nomer_wa: true,
            }
          },
          rewards: {
            select: {
              reward_name: true,
              point_cost: true,
            }
          }
        }
      });

      return {
        currentRedemption,
        updatedRedemption
      };
    });

    // Send notification about confirmation
    // await createRewardStatusNotification({
    //   memberId: result.updatedRedemption.id_member,
    //   rewardName: result.updatedRedemption.rewards.reward_name,
    //   status: 'diterima',
    //   coinRefund: 0 // No refund for confirmed receipt
    // });

    // Transform the response
    const updatedRedemption = result.updatedRedemption;
    const transformedRedemption = {
      id: updatedRedemption.id,
      member_id: updatedRedemption.id_member,
      reward_id: updatedRedemption.id_reward,
      quantity: updatedRedemption.quantity,
      points_spent: updatedRedemption.points_spent,
      status: updatedRedemption.status,
      shipping_notes: updatedRedemption.shipping_notes,
      redemption_notes: updatedRedemption.redemption_notes,
      shipped_at: updatedRedemption.shipped_at?.toISOString(),
      delivered_at: updatedRedemption.delivered_at?.toISOString(),
      redeemed_at: updatedRedemption.redeemed_at?.toISOString(),
      member_name: updatedRedemption.members?.nama_lengkap || 'N/A',
      member_wa: updatedRedemption.members?.nomer_wa || 'N/A',
      reward_name: updatedRedemption.rewards?.reward_name || 'N/A',
      reward_cost: updatedRedemption.rewards?.point_cost || 0,
    };

    return NextResponse.json({
      success: true,
      data: transformedRedemption,
      message: 'Konfirmasi berhasil! Status telah diubah menjadi "Diterima"'
    });

  } catch (error) {
    console.error('Error confirming redemption:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Redemption not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}