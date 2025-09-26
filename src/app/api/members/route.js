import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(_request) {
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