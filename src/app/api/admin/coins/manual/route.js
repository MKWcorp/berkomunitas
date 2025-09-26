import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
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

    const { member_id, coins, reason } = await request.json();

    // Validation
    if (!member_id || !coins || !reason) {
      return NextResponse.json(
        { error: 'member_id, coins, and reason are required' },
        { status: 400 }
      );
    }

    if (isNaN(coins) || coins === 0) {
      return NextResponse.json(
        { error: 'Coins must be a non-zero number' },
        { status: 400 }
      );
    }

    if (reason.trim().length < 5) {
      return NextResponse.json(
        { error: 'Reason must be at least 5 characters long' },
        { status: 400 }
      );
    }

    // Check if member exists and get current balance
    const member = await prisma.members.findUnique({
      where: { id: parseInt(member_id) },
      select: {
        id: true,
        nama_lengkap: true,
        coin: true
      }
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    const currentCoins = member.coin || 0;
    const coinsToProcess = parseInt(coins);

    // For negative operations, check if member has enough coins
    if (coinsToProcess < 0) {
      const coinsToSubtract = Math.abs(coinsToProcess);
      if (coinsToSubtract > currentCoins) {
        return NextResponse.json(
          { error: `Cannot subtract ${coinsToSubtract.toLocaleString('id-ID')} coins. Member ${member.nama_lengkap} hanya memiliki ${currentCoins.toLocaleString('id-ID')} coins.` },
          { status: 400 }
        );
      }
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update member's coin balance
      const updatedMember = await tx.members.update({
        where: { id: parseInt(member_id) },
        data: {
          coin: {
            increment: coinsToProcess
          }
        },
        select: {
          id: true,
          nama_lengkap: true,
          coin: true
        }
      });

      // Create history record
      const historyRecord = await tx.coin_history.create({
        data: {
          member_id: parseInt(member_id),
          coin: coinsToProcess,
          event: reason.trim(),
          event_type: 'admin_manual'
        }
      });

      return {
        member: updatedMember,
        history: historyRecord
      };
    });

    return NextResponse.json({
      success: true,
      message: `Coins successfully ${coinsToProcess > 0 ? 'added to' : 'deducted from'} ${result.member.nama_lengkap}`,
      data: {
        member: result.member,
        transaction: {
          coins: coinsToProcess,
          previous_balance: currentCoins,
          new_balance: result.member.coin,
          reason: reason.trim()
        }
      }
    });

  } catch (error) {
    console.error('Error in manual coins API:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Constraint violation occurred' },
        { status: 400 }
      );
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error while processing coin transaction' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}