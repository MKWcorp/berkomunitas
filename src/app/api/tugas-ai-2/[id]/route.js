/**
 * User-facing API Route: /api/tugas-ai-2/[id]
 * Get screenshot task details for regular users
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateSSOCookie } from '@/lib/sso';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const taskId = parseInt(resolvedParams.id);

    if (isNaN(taskId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid task ID' },
        { status: 400 }
      );
    }

    // Get user from SSO cookie (optional for public task view)
    const cookieHeader = request.headers.get('cookie');
    let user = null;
    let memberId = null;

    try {
      user = await validateSSOCookie(cookieHeader);
      if (user && user.email) {
        const member = await prisma.members.findFirst({
          where: { email: user.email },
          select: { id: true }
        });
        memberId = member?.id;
      }
    } catch (err) {
      // User not logged in, that's okay - show public task
    }

    // Fetch task details
    const task = await prisma.tugas_ai_2.findUnique({
      where: { id: taskId },
      include: {
        tugas_ai_2_screenshots: memberId ? {
          where: {
            task_submission: {
              id_member: memberId
            }
          },
          orderBy: {
            uploaded_at: 'desc'
          }
        } : false, // Don't include screenshots if user not logged in
      }
    });

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Task not found' },
        { status: 404 }
      );
    }

    // If user is logged in, get their submission status
    let status_submission = 'tersedia';
    if (memberId) {
      const submission = await prisma.task_submissions.findFirst({
        where: {
          id_member: memberId,
          id_task: taskId,
        },
        orderBy: {
          waktu_klik: 'desc'
        }
      });

      if (submission) {
        status_submission = submission.status_submission;
      }
    }

    // Convert BigInt to Number
    function convertBigInt(obj) {
      if (Array.isArray(obj)) return obj.map(convertBigInt);
      if (obj && typeof obj === 'object') {
        if (obj instanceof Date) return obj;
        
        const out = {};
        for (const k in obj) {
          if (typeof obj[k] === 'bigint') {
            out[k] = Number(obj[k]);
          } else {
            out[k] = convertBigInt(obj[k]);
          }
        }
        return out;
      }
      return obj;
    }

    const taskData = convertBigInt({
      ...task,
      status_submission,
    });

    return NextResponse.json({
      success: true,
      task: taskData,
    });

  } catch (error) {
    console.error('Error fetching screenshot task:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
