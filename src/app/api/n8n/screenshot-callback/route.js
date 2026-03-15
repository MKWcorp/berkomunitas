import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/n8n/screenshot-callback
 *
 * N8n AI calls this endpoint after verifying a task screenshot.
 * This is a server-to-server endpoint secured by a shared secret header.
 *
 * Payload from n8n:
 * {
 *   screenshotId: number,
 *   submissionId: number,
 *   status: 'selesai' | 'gagal',
 *   ai_confidence?: number,        // 0-100 confidence score
 *   ai_text?: string,              // OCR or AI-detected text
 *   notes?: string,                // Human-readable rejection reason
 *   n8n_execution_id?: string,     // n8n workflow execution ID for tracing
 * }
 */
export async function POST(request) {
  console.log('🤖 [N8n Screenshot Callback] Received callback...');

  // Validate shared secret to prevent unauthorised calls
  const authHeader = request.headers.get('x-n8n-secret') || request.headers.get('authorization');
  const expectedSecret = process.env.N8N_WEBHOOK_SECRET;
  if (expectedSecret && authHeader !== expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    console.warn('❌ [N8n Screenshot Callback] Unauthorised — invalid secret');
    return NextResponse.json({ success: false, message: 'Unauthorised' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
  }

  const { screenshotId, submissionId, status, ai_confidence, ai_text, notes, n8n_execution_id } = body;

  // Validate required fields
  if (!screenshotId || !submissionId || !status) {
    console.error('❌ [N8n Screenshot Callback] Missing required fields:', { screenshotId, submissionId, status });
    return NextResponse.json(
      { success: false, message: 'screenshotId, submissionId, and status are required' },
      { status: 400 }
    );
  }

  if (!['selesai', 'gagal'].includes(status)) {
    return NextResponse.json(
      { success: false, message: 'status must be "selesai" or "gagal"' },
      { status: 400 }
    );
  }

  try {
    // Load submission + task in one query
    const submission = await prisma.tugas_ai_2_submissions.findUnique({
      where: { id: submissionId },
      include: {
        tugas_ai_2: {
          select: { id: true, point_value: true, keyword_tugas: true },
        },
      },
    });

    if (!submission) {
      console.error('❌ [N8n Screenshot Callback] Submission not found:', submissionId);
      return NextResponse.json({ success: false, message: 'Submission not found' }, { status: 404 });
    }

    if (submission.status === 'selesai') {
      console.warn('⚠️ [N8n Screenshot Callback] Submission already completed — skipping');
      return NextResponse.json({ success: true, message: 'Already completed', skipped: true });
    }

    const screenshot = await prisma.tugas_ai_2_screenshots.findUnique({
      where: { id: screenshotId },
    });

    if (!screenshot) {
      console.error('❌ [N8n Screenshot Callback] Screenshot not found:', screenshotId);
      return NextResponse.json({ success: false, message: 'Screenshot not found' }, { status: 404 });
    }

    const memberId = submission.member_id;
    const taskId  = submission.tugas_ai_2_id;
    const pointValue = submission.tugas_ai_2?.point_value ?? 10;

    console.log(`🤖 [N8n Screenshot Callback] Processing: submission=${submissionId} status=${status} member=${memberId}`);

    // Update screenshot record
    const screenshotUpdateData = {
      status: status === 'selesai' ? 'selesai' : 'gagal_diverifikasi',
      verification_attempts: { increment: 1 },
      updated_at: new Date(),
    };
    if (n8n_execution_id) screenshotUpdateData.n8n_execution_id = n8n_execution_id;

    // Update submission record
    const submissionUpdateData = {
      status: status === 'selesai' ? 'selesai' : 'gagal',
      updated_at: new Date(),
    };
    if (status === 'selesai') submissionUpdateData.waktu_selesai = new Date();

    // Run all DB updates atomically
    await prisma.$transaction(async (tx) => {
      // 1. Update screenshot
      await tx.tugas_ai_2_screenshots.update({
        where: { id: screenshotId },
        data: screenshotUpdateData,
      });

      // 2. Update submission
      await tx.tugas_ai_2_submissions.update({
        where: { id: submissionId },
        data: submissionUpdateData,
      });

      // 3. If approved — award points to member
      if (status === 'selesai') {
        // Upsert member_stats (completed_tasks + 1, pending_tasks - 1)
        const existingStats = await tx.member_stats.findUnique({ where: { member_id: memberId } });
        if (existingStats) {
          await tx.member_stats.update({
            where: { member_id: memberId },
            data: {
              total_points: { increment: pointValue },
              completed_tasks: { increment: 1 },
              pending_tasks: { decrement: 1 },
              updated_at: new Date(),
            },
          });
        } else {
          await tx.member_stats.create({
            data: {
              member_id: memberId,
              total_points: pointValue,
              completed_tasks: 1,
              pending_tasks: 0,
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
        }

        // Insert coin transaction record
        await tx.coin_transactions.create({
          data: {
            member_id: memberId,
            jumlah: pointValue,
            tipe: 'kredit',
            keterangan: `Screenshot task selesai: ${submission.tugas_ai_2?.keyword_tugas ?? 'Tugas AI'}`,
            referensi_id: taskId,
            referensi_tipe: 'tugas_ai_2',
            created_at: new Date(),
          },
        }).catch(err => {
          // Non-fatal — coin_transactions might have different schema
          console.warn('⚠️ [N8n Screenshot Callback] Could not create coin_transaction:', err.message);
        });

        console.log(`✅ [N8n Screenshot Callback] APPROVED: member=${memberId} +${pointValue} pts`);
      } else {
        // Rejected — update pending_tasks only if needed
        console.log(`❌ [N8n Screenshot Callback] REJECTED: member=${memberId} submission=${submissionId}`);
      }
    });

    return NextResponse.json({
      success: true,
      message: status === 'selesai' ? 'Screenshot approved and points awarded' : 'Screenshot rejected',
      data: { screenshotId, submissionId, status, memberId, pointValue: status === 'selesai' ? pointValue : 0 },
    });

  } catch (error) {
    console.error('❌ [N8n Screenshot Callback] Fatal error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
