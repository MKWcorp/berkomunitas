import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    // 1. Total Members
    const totalMembers = await prisma.members.count();

    // 2. Total Comments (from cached statistic)
    const totalCommentsStat = await prisma.statistik_global.findUnique({
      where: { nama_statistik: 'total_seluruh_komentar' }
    });
    const totalComments = totalCommentsStat ? Number(totalCommentsStat.nilai_statistik) : 0;

    // 3. Total Tasks (tugas_ai + tugas_ai_2)
    const [tugas1Count, tugas2Count] = await Promise.all([
      prisma.tugas_ai.count(),
      prisma.tugas_ai_2.count()
    ]);
    const totalTasks = tugas1Count + tugas2Count;
    
    // 4. Total Poin (Optional, adds "wow" factor)
    const totalPointsResult = await prisma.members.aggregate({
        _sum: {
            loyalty_point: true
        }
    });
    const totalPoints = totalPointsResult._sum.loyalty_point || 0;

    return NextResponse.json({
      users: totalMembers,
      comments: totalComments,
      tasks: totalTasks,
      points: totalPoints
    });
  } catch (error) {
    console.error('Error fetching landing stats:', error);
    return NextResponse.json({ 
      users: 0, 
      comments: 0, 
      tasks: 0,
      points: 0
    }, { status: 500 });
  }
}
