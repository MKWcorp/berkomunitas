import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createRewardStatusNotification } from '../../../../../../../lib/rewardNotifications.js';

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes, shipping_notes, admin_notes, redemption_notes, tracking_number, confirmFinal } = body;

    // Mapping sesuai dengan frontend:
    // notes (Keterangan dari admin) → redemption_notes  
    // shipping_notes/redemptionNotes (Catatan Redem dari user) → shipping_notes
    const finalRedemptionNotes = notes || redemption_notes || ''; // Keterangan admin (WAJIB)
    const finalShippingNotes = shipping_notes || ''; // Catatan Redem user (optional)

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    if (!finalRedemptionNotes) {
      return NextResponse.json(
        { error: 'Keterangan are required' },
        { status: 400 }
      );
    }

    // Use transaction for refund operations
    const result = await prisma.$transaction(async (tx) => {
      // Get current redemption data first
      const currentRedemption = await tx.reward_redemptions.findUnique({
        where: { id: parseInt(id) },
        include: {
          members: {
            select: {
              id: true,
              nama_lengkap: true,
              nomer_wa: true,
              coin: true,
            }
          },
          rewards: {
            select: {
              id: true,
              reward_name: true,
              point_cost: true,
              stock: true,
            }
          }
        }
      });

      if (!currentRedemption) {
        throw new Error('Redemption not found');
      }

      // Validasi status final - tidak bisa diubah setelah diterima atau ditolak
      const finalStatuses = ['diterima', 'ditolak'];
      const currentStatus = currentRedemption.status;
      
      if (finalStatuses.includes(currentStatus)) {
        throw new Error(`Status tidak dapat diubah dari "${currentStatus.toUpperCase()}". Status ini sudah final dan tidak dapat diubah lagi.`);
      }

      // Validasi untuk mencegah perubahan ke status final tanpa konfirmasi
      if (finalStatuses.includes(status)) {
        const { confirmFinal } = body;
        if (!confirmFinal) {
          throw new Error(`Konfirmasi diperlukan untuk status "${status.toUpperCase()}". Status ini akan menjadi final dan tidak dapat diubah lagi. Pastikan keputusan Anda sudah benar.`);
        }
      }

      // Prepare update data dengan mapping yang benar:
      // finalShippingNotes (Catatan Redem user) → shipping_notes
      // finalRedemptionNotes (Keterangan admin) → redemption_notes
      const updateData = {
        status,
        shipping_notes: finalShippingNotes,
        redemption_notes: finalRedemptionNotes,
      };

      // Set shipped_at when status is "dikirim"
      if (status === 'dikirim') {
        updateData.shipped_at = new Date();
      }

      // Set delivered_at when status is "diterima"
      if (status === 'diterima') {
        updateData.delivered_at = new Date();
        if (!updateData.shipped_at) {
          updateData.shipped_at = new Date();
        }
      }

      // Handle refund for rejected/cancelled redemptions
      const isRefundStatus = status === 'ditolak' || status === 'dibatalkan';
      const wasNotRefunded = currentRedemption.status !== 'ditolak' && currentRedemption.status !== 'dibatalkan';
      
      if (isRefundStatus && wasNotRefunded) {
        // Refund coins to member
        await tx.members.update({
          where: { id: currentRedemption.id_member },
          data: {
            coin: { increment: currentRedemption.points_spent }
          }
        });

        // Return stock to reward
        const quantity = currentRedemption.quantity || 1;
        await tx.rewards.update({
          where: { id: currentRedemption.id_reward },
          data: {
            stock: { increment: quantity }
          }
        });

        // Log refund in point history
        await tx.loyalty_point_history.create({
          data: {
            member_id: currentRedemption.id_member,
            event: `Refund Penukaran Hadiah: ${currentRedemption.rewards.reward_name}${quantity > 1 ? ` (${quantity}x)` : ''} - ${status.toUpperCase()}`,
            point: currentRedemption.points_spent,
            event_type: 'reward_refund',
            created_at: new Date(),
          }
        });
      }

      // Update the redemption
      const updatedRedemption = await tx.reward_redemptions.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          members: {
            select: {
              nama_lengkap: true,
              nomer_wa: true,
              coin: true,
            }
          },
          rewards: {
            select: {
              reward_name: true,
              point_cost: true,
              stock: true,
            }
          }
        }
      });

      return {
        currentRedemption,
        updatedRedemption
      };
    });

    // Send notification to member about status update
    const isRefundStatus = status === 'ditolak' || status === 'dibatalkan';
    const wasNotRefunded = result.currentRedemption.status !== 'ditolak' && result.currentRedemption.status !== 'dibatalkan';
    const coinRefund = isRefundStatus && wasNotRefunded ? result.currentRedemption.points_spent : 0;
    
    await createRewardStatusNotification({
      memberId: result.updatedRedemption.id_member,
      rewardName: result.updatedRedemption.rewards.reward_name,
      status: status,
      coinRefund: coinRefund
    });

    // Transform the response to match frontend expectations
    const updatedRedemption = result.updatedRedemption;
    const transformedRedemption = {
      id: updatedRedemption.id,
      member_id: updatedRedemption.id_member,
      reward_id: updatedRedemption.id_reward,
      quantity: updatedRedemption.quantity,
      total_cost: updatedRedemption.points_spent,
      status: updatedRedemption.status,
      admin_notes: updatedRedemption.redemption_notes,
      shipping_notes: updatedRedemption.shipping_notes,
      redemption_notes: updatedRedemption.redemption_notes,
      tracking_number: updatedRedemption.tracking_number,
      created_at: updatedRedemption.redeemed_at,
      updated_at: updatedRedemption.updated_at,
      member_name: updatedRedemption.members?.nama_lengkap || 'N/A',
      member_wa: updatedRedemption.members?.nomer_wa || 'N/A',
      member_coins: updatedRedemption.members?.coin || 0,
      reward_name: updatedRedemption.rewards?.reward_name || 'N/A',
      reward_cost: updatedRedemption.rewards?.point_cost || 0,
      reward_stock: updatedRedemption.rewards?.stock || 0,
    };

    return NextResponse.json({
      success: true,
      data: transformedRedemption
    });

  } catch (error) {
    console.error('Error updating redemption status:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Redemption not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}