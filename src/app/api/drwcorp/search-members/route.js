import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

// GET /api/drwcorp/search-members - Search members by name or email
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return NextResponse.json({ 
        success: true, 
        members: [] 
      });
    }

    // Search members by name or email
    const members = await prisma.members.findMany({
      where: {
        OR: [
          {
            nama_lengkap: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      },
      select: {
        id: true,
        nama_lengkap: true,
        email: true,
        loyalty_point: true,
        foto_profil_url: true
      },
      orderBy: {
        loyalty_point: 'desc'
      },
      take: 10
    });

    return NextResponse.json({ 
      success: true, 
      members 
    });

  } catch (error) {
    console.error('Error searching members:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search members' },
      { status: 500 }
    );
  }
}
