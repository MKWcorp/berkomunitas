import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the member by clerk_id
    const member = await prisma.members.findFirst({
      where: {
        clerk_id: userId
      },
      select: {
        id: true,
        coin: true
      }
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    // Get coin history from coin_history table
    const coinHistory = await prisma.coin_history.findMany({
      where: {
        member_id: member.id
      },
      orderBy: {
        created_at: 'desc'
      },
      select: {
        id: true,
        event: true,
        coin: true,
        created_at: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        coin: member.coin,
        coin_history: coinHistory
      }
    });

  } catch (error) {
    console.error('Error fetching coins data:', error);
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