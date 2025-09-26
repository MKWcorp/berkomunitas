import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// GET /api/members/current - Get current logged in member data
export async function GET(request) {
  try {
    // Get authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required'
      }, { status: 401 });
    }

    // Find member by clerk_id
    const member = await prisma.members.findFirst({
      where: { clerk_id: userId },
      select: {
        id: true,
        nama_lengkap: true,
        nomer_wa: true,
        tanggal_daftar: true,
        loyalty_point: true,
        coin: true,
        clerk_id: true,
        status_kustom: true
      }
    });

    if (!member) {
      return NextResponse.json({
        success: false,
        message: 'Member profile not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        nama_lengkap: member.nama_lengkap,
        nomer_wa: member.nomer_wa,
        tanggal_daftar: member.tanggal_daftar,
        loyalty_point: member.loyalty_point,
        coin: member.coin,
        clerk_id: member.clerk_id,
        status_kustom: member.status_kustom
      }
    });

  } catch (error) {
    console.error('Error fetching current member:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}