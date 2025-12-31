import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
export async function GET(request) {
  try {
    const members = await prisma.members.findMany({
      include: {
        user_privileges: {
          where: { is_active: true }
        }
      },
      orderBy: {
        tanggal_daftar: 'desc'
      }
    });
    return NextResponse.json({
      success: true,
      data: members
    });
  } catch (____error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data members' },
      { status: 500 }
    );
  }
} 