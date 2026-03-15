/**
 * API Route: /api/tugas/[id]/screenshot
 * Handle screenshot upload for tugas_ai_2 tasks
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/ssoAuth';
import { uploadToMinIO } from '@/lib/storage';

// Helper function to recalculate member stats
async function recalculateCompletedTasks(memberId) {
  const submissionStats = await prisma.task_submissions.groupBy({
    by: ['status_submission'],
    where: { id_member: memberId },
    _count: { id: true }
  });

  const screenshotStats = await prisma.tugas_ai_2_screenshots.groupBy({
    by: ['status'],
    where: { member_id: memberId },
    _count: { id: true }
  });

  let completedTasks = 0;
  let pendingTasks = 0;
  let failedTasks = 0;

  submissionStats.forEach(stat => {
    const count = stat._count.id;
    switch (stat.status_submission) {
      case 'selesai': completedTasks += count; break;
      case 'sedang_verifikasi': pendingTasks += count; break;
      case 'gagal_diverifikasi': failedTasks += count; break;
    }
  });

  screenshotStats.forEach(stat => {
    const count = stat._count.id;
    switch (stat.status) {
      case 'selesai': completedTasks += count; break;
      case 'sedang_verifikasi': pendingTasks += count; break;
      case 'gagal_diverifikasi': failedTasks += count; break;
    }
  });

  await prisma.member_task_stats.upsert({
    where: { member_id: memberId },
    update: {
      completed_tasks: completedTasks,
      pending_tasks: pendingTasks,
      failed_tasks: failedTasks,
      updated_at: new Date()
    },
    create: {
      member_id: memberId,
      total_tasks: 0,
      completed_tasks: completedTasks,
      pending_tasks: pendingTasks,
      failed_tasks: failedTasks
    }
  });
}

export async function POST(request, { params }) {
  console.log('📸 [Screenshot Upload] Starting...');
  
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const taskId = parseInt(id);
    console.log('📸 [Screenshot Upload] Task ID:', taskId);

    if (isNaN(taskId)) {
      console.log('❌ [Screenshot Upload] Invalid task ID');
      return NextResponse.json(
        { success: false, message: 'Invalid task ID' },
        { status: 400 }
      );
    }

    // Validate user authentication
    console.log('📸 [Screenshot Upload] Authenticating user...');
    const user = await getCurrentUser(request);

    if (!user || !user.id) {
      console.log('❌ [Screenshot Upload] Unauthorized - no user');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const memberId = user.id;
    console.log('✅ [Screenshot Upload] User authenticated:', memberId);

    // Verify task exists
    console.log('📸 [Screenshot Upload] Verifying task...');
    const task = await prisma.tugas_ai_2.findUnique({
      where: { id: taskId },
      select: { 
        id: true, 
        keyword_tugas: true,
        verification_rules: true,
        point_value: true,
        source: true,
      }
    });

    if (!task) {
      console.log('❌ [Screenshot Upload] Task not found:', taskId);
      return NextResponse.json(
        { success: false, message: 'Task not found or not a screenshot task' },
        { status: 404 }
      );
    }
    console.log('✅ [Screenshot Upload] Task verified:', task.id);

    // Gate: user must have clicked "Kerjakan" first (have an active submission)
    const activeSubmission = await prisma.tugas_ai_2_submissions.findUnique({
      where: { member_id_tugas_ai_2_id: { member_id: memberId, tugas_ai_2_id: taskId } },
    });

    if (!activeSubmission) {
      console.log('❌ [Screenshot Upload] No active submission — user must click Kerjakan first');
      return NextResponse.json(
        { success: false, message: 'Klik tombol Kerjakan terlebih dahulu sebelum mengupload screenshot' },
        { status: 403 }
      );
    }

    if (activeSubmission.status === 'selesai') {
      return NextResponse.json(
        { success: false, message: 'Tugas ini sudah diselesaikan' },
        { status: 400 }
      );
    }

    if (activeSubmission.batas_waktu && new Date(activeSubmission.batas_waktu) < new Date()) {
      // Mark submission as expired
      await prisma.tugas_ai_2_submissions.update({
        where: { id: activeSubmission.id },
        data: { status: 'expired', updated_at: new Date() },
      });
      return NextResponse.json(
        { success: false, message: 'Waktu pengerjaan sudah habis. Klik Kerjakan lagi untuk memulai ulang.' },
        { status: 400 }
      );
    }

    // Parse form data
    console.log('📸 [Screenshot Upload] Parsing form data...');
    const formData = await request.formData();
    const screenshot = formData.get('screenshot');
    const commentLink = formData.get('comment_link') || ''; // Optional field
    console.log('📸 [Screenshot Upload] Screenshot:', screenshot ? screenshot.name : 'none');

    if (!screenshot) {
      console.log('❌ [Screenshot Upload] No screenshot in form');
      return NextResponse.json(
        { success: false, message: 'Screenshot is required' },
        { status: 400 }
      );
    }

    // Check if already uploaded a screenshot in this submission
    console.log('📸 [Screenshot Upload] Checking existing screenshot...');
    const existingScreenshot = await prisma.tugas_ai_2_screenshots.findFirst({
      where: {
        tugas_ai_2_id: taskId,
        member_id: memberId,
        submission_id: activeSubmission.id,
        status: { not: 'gagal_diverifikasi' }, // allow re-upload after rejection
      }
    });

    if (existingScreenshot) {
      console.log('❌ [Screenshot Upload] Screenshot already exists:', existingScreenshot.status);
      return NextResponse.json(
        { 
          success: false, 
          message: existingScreenshot.status === 'selesai'
            ? 'Anda sudah menyelesaikan tugas ini'
            : 'Screenshot sudah diupload dan sedang diverifikasi'
        },
        { status: 400 }
      );
    }

    // Upload screenshot to MinIO only - no fallback
    console.log('📸 [Screenshot Upload] Uploading to MinIO...');
    const screenshotFilename = screenshot.name;
    
    const screenshotUrl = await uploadToMinIO(screenshot, 'screenshots', 'task');
    console.log('✅ [Screenshot Upload] MinIO upload successful:', screenshotUrl);

    // Create screenshot record linked to the active submission
    console.log('📸 [Screenshot Upload] Creating screenshot record...');
    const screenshotRecord = await prisma.tugas_ai_2_screenshots.create({
      data: {
        tugas_ai_2_id: taskId,
        member_id: memberId,
        submission_id: activeSubmission.id,
        screenshot_url: screenshotUrl,
        screenshot_filename: screenshotFilename,
        link_komentar: commentLink,
        status: 'sedang_verifikasi',
        verification_attempts: 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    // Advance submission state to sedang_verifikasi
    await prisma.tugas_ai_2_submissions.update({
      where: { id: activeSubmission.id },
      data: {
        status: 'sedang_verifikasi',
        waktu_upload: new Date(),
        updated_at: new Date(),
      },
    });
    console.log('✅ [Screenshot Upload] Screenshot record created:', screenshotRecord.id);

    // Recalculate member stats to reflect new pending task
    console.log('📊 [Screenshot Upload] Recalculating member stats...');
    try {
      await recalculateCompletedTasks(memberId);
      console.log('✅ [Screenshot Upload] Member stats recalculated');
    } catch (statError) {
      console.error('❌ [Screenshot Upload] Failed to recalculate stats:', statError);
      // Don't fail the upload if stats recalculation fails
    }

    // Trigger n8n webhook for AI screenshot verification (fire-and-forget)
    const n8nWebhookUrl = process.env.N8N_SCREENSHOT_VERIFICATION_WEBHOOK;
    if (n8nWebhookUrl) {
      console.log('🤖 [Screenshot Upload] Triggering n8n verification webhook...');
      fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshotId: screenshotRecord.id,
          submissionId: activeSubmission.id,
          taskId: taskId,
          memberId: memberId,
          platform: task.source || 'instagram',
          screenshotUrl: screenshotUrl,
          commentLink: commentLink,
          keyword: task.keyword_tugas,
          verificationRules: task.verification_rules,
          callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://berkomunitas.com'}/api/n8n/screenshot-callback`,
        }),
      }).catch(err => console.error('❌ [Screenshot Upload] n8n webhook fire failed:', err));
    } else {
      console.warn('⚠️ [Screenshot Upload] N8N_SCREENSHOT_VERIFICATION_WEBHOOK not set — skipping AI verification trigger');
    }

    console.log('✅ [Screenshot Upload] Complete! Success response sending...');
    return NextResponse.json({
      success: true,
      message: 'Screenshot uploaded successfully',
      data: {
        screenshotId: screenshotRecord.id,
        status: 'sedang_verifikasi',
        deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours from now
      }
    });

  } catch (error) {
    console.error('❌ [Screenshot Upload] Fatal Error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error: ' + error.message,
        error: error.message,
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
