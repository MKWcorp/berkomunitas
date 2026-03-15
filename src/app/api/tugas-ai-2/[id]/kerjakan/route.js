/**
 * POST /api/tugas-ai-2/[id]/kerjakan
 *
 * Creates a submission record in tugas_ai_2_submissions when a user clicks
 * the "Kerjakan" button on a screenshot task (TikTok, Facebook, etc).
 *
 * Flow:
 *   User clicks "Kerjakan" → POST here → record created → response includes
 *   link_postingan so frontend can open it → frontend unlocks screenshot form
 *
 * Returns:
 *   { success, submission_id, link_postingan, batas_waktu, keyword_tugas }
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/ssoAuth';

// Window (in hours) the user has to upload a screenshot after clicking "Kerjakan"
const SUBMISSION_WINDOW_HOURS = 24;

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const taskId = parseInt(id);

    if (isNaN(taskId)) {
      return NextResponse.json({ success: false, message: 'Invalid task ID' }, { status: 400 });
    }

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Resolve member from JWT user
    const member = await prisma.members.findFirst({
      where: {
        OR: [
          { email: user.email },
          ...(user.google_id ? [{ google_id: user.google_id }] : []),
        ],
      },
      select: { id: true },
    });

    if (!member) {
      return NextResponse.json({ success: false, message: 'Member not found' }, { status: 404 });
    }
    const memberId = member.id;

    // Fetch task
    const task = await prisma.tugas_ai_2.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        status: true,
        source: true,
        link_postingan: true,
        keyword_tugas: true,
        point_value: true,
        expires_at: true,
        max_submissions: true,
        verification_rules: true,
      },
    });

    if (!task) {
      return NextResponse.json({ success: false, message: 'Task not found' }, { status: 404 });
    }

    if (task.status !== 'tersedia') {
      return NextResponse.json({ success: false, message: 'Task sudah tidak tersedia' }, { status: 400 });
    }

    if (task.expires_at && new Date(task.expires_at) < new Date()) {
      return NextResponse.json({ success: false, message: 'Task sudah kadaluarsa' }, { status: 400 });
    }

    // Check existing submission for this user + task
    const existing = await prisma.tugas_ai_2_submissions.findUnique({
      where: { member_id_tugas_ai_2_id: { member_id: memberId, tugas_ai_2_id: taskId } },
    });

    if (existing) {
      // If already finished → reject
      if (existing.status === 'selesai') {
        return NextResponse.json({ success: false, message: 'Tugas sudah diselesaikan' }, { status: 400 });
      }

      // If active / waiting screenshot → return existing so frontend unlocks form
      if (['dikerjakan', 'menunggu_screenshot', 'sedang_verifikasi'].includes(existing.status)) {
        return NextResponse.json({
          success: true,
          already_started: true,
          submission_id: existing.id,
          link_postingan: task.link_postingan,
          batas_waktu: existing.batas_waktu,
          keyword_tugas: task.keyword_tugas,
          status: existing.status,
        });
      }

      // If gagal and retries still available → reset to dikerjakan
      const maxRetries = existing.max_retries ?? 3;
      if (existing.status === 'gagal' && existing.verification_attempts < maxRetries) {
        const now = new Date();
        const batas_waktu = new Date(now.getTime() + SUBMISSION_WINDOW_HOURS * 60 * 60 * 1000);

        const updated = await prisma.tugas_ai_2_submissions.update({
          where: { id: existing.id },
          data: {
            status: 'dikerjakan',
            waktu_klik: now,
            batas_waktu,
            updated_at: now,
          },
        });

        return NextResponse.json({
          success: true,
          retry: true,
          submission_id: updated.id,
          link_postingan: task.link_postingan,
          batas_waktu: updated.batas_waktu,
          keyword_tugas: task.keyword_tugas,
          status: updated.status,
        });
      }

      // Retries exhausted
      return NextResponse.json({
        success: false,
        message: `Batas percobaan (${existing.max_retries}) sudah habis`,
      }, { status: 400 });
    }

    // Create new submission
    const now = new Date();
    const batas_waktu = new Date(now.getTime() + SUBMISSION_WINDOW_HOURS * 60 * 60 * 1000);

    const submission = await prisma.tugas_ai_2_submissions.create({
      data: {
        tugas_ai_2_id: taskId,
        member_id: memberId,
        platform: task.source ?? 'unknown',
        status: 'dikerjakan',
        waktu_klik: now,
        batas_waktu,
        max_retries: task.max_submissions ?? 3,
        metadata: {
          task_point_value: task.point_value,
          verification_rules: task.verification_rules,
        },
      },
    });

    return NextResponse.json({
      success: true,
      submission_id: submission.id,
      link_postingan: task.link_postingan,
      batas_waktu: submission.batas_waktu,
      keyword_tugas: task.keyword_tugas,
      status: submission.status,
    });

  } catch (error) {
    console.error('[kerjakan] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', detail: error.message },
      { status: 500 }
    );
  }
}
