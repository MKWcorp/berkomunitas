import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { auth } from '@clerk/nextjs/server';

/**
 * POST /api/task-submissions/timeout
 * Handles task timeout - updates status to 'gagal_diverifikasi'
 * 
 * Body:
 * - taskId: The ID of the task that timed out
 */
export async function POST(request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json({ 
        success: false, 
        error: 'taskId is required' 
      }, { status: 400 });
    }

    // Verify that the authenticated user owns this submission
    const member = await prisma.members.findUnique({
      where: { clerk_id: userId },
      select: { id: true },
    });

    if (!member) {
      return NextResponse.json({ 
        success: false, 
        error: 'Member not found' 
      }, { status: 404 });
    }

    // Update the submission status to timeout
    const updatedSubmission = await prisma.task_submissions.updateMany({
      where: {
        id_member: member.id,
        id_task: parseInt(taskId),
        status_submission: 'sedang_verifikasi',
        // Only timeout submissions that are actually past deadline
        waktu_klik: {
          lt: new Date(new Date().getTime() - 4 * 60 * 60 * 1000) // 4 hours ago
        }
      },
      data: {
        status_submission: 'gagal_diverifikasi',
      },
    });

    if (updatedSubmission.count === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No valid submission found to timeout' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Task submission marked as timed out',
      updated_count: updatedSubmission.count,
    });

  } catch (error) {
    console.error('Error handling task timeout:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal Server Error' 
    }, { status: 500 });
  }
}
