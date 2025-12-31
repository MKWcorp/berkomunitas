import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';
/**
 * GET /api/task-submissions
 * Fetches task submission statuses for a specific member
 * 
 * Query Parameters:
 * - memberId: The ID of the member to get submissions for
 */
export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('memberId');

  if (!memberId) {
    return NextResponse.json({ success: false, error: 'memberId is required' }, { status: 400 });
  }

  try {
    const submissions = await prisma.task_submissions.findMany({
      where: {
        id_member: parseInt(memberId),
      },
      include: {
        tugas_ai: {
          select: {
            id: true,
            nama_tugas: true,
            point_value: true,
          }
        }
      },
      orderBy: {
        waktu_klik: 'desc',
      },
    });

    // Convert BigInt fields
    const processedSubmissions = submissions.map(submission => ({
      ...submission,
      id: Number(submission.id),
      id_member: Number(submission.id_member),
      id_task: Number(submission.id_task),
      tugas_ai: submission.tugas_ai ? {
        ...submission.tugas_ai,
        id: Number(submission.tugas_ai.id),
        point_value: Number(submission.tugas_ai.point_value),
      } : null,
    }));

    return NextResponse.json({
      success: true,
      submissions: processedSubmissions,
    });

  } catch (error) {
    console.error('Error fetching task submissions:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
