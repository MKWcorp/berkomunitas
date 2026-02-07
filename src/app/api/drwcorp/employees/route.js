import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

// GET /api/drwcorp/employees - Get all employees with optional filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const divisi = searchParams.get('divisi');
    const matchingStatus = searchParams.get('matchingStatus');
    const search = searchParams.get('search');

    const where = {};

    if (divisi && divisi !== 'all') {
      where.divisi = divisi;
    }

    if (matchingStatus && matchingStatus !== 'all') {
      where.matching_status = matchingStatus;
    }

    if (search) {
      where.OR = [
        { nama_lengkap: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const employees = await prisma.drwcorp_employees.findMany({
      where,
      include: {
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            email: true,
            loyalty_point: true,
            foto_profil_url: true
          }
        }
      },
      orderBy: [
        { divisi: 'asc' },
        { nama_lengkap: 'asc' }
      ]
    });

    // Get unique divisi list
    const divisiList = await prisma.drwcorp_employees.findMany({
      select: { divisi: true },
      distinct: ['divisi']
    });

    // Get statistics
    const stats = await prisma.drwcorp_employees.groupBy({
      by: ['matching_status'],
      _count: true
    });

    const statistics = {
      total: employees.length,
      matched: stats.find(s => s.matching_status === 'matched')?._count || 0,
      ambiguous: stats.find(s => s.matching_status === 'ambiguous')?._count || 0,
      unmatched: stats.find(s => s.matching_status === 'unmatched')?._count || 0
    };

    return NextResponse.json({
      success: true,
      employees,
      divisiList: divisiList.map(d => d.divisi).sort(),
      statistics
    });

  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
