import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '../../../../../../lib/requireAdmin';
import { convertBigInt } from '../../../../../../lib/bigIntUtils';
import { createTaskCompletionNotification, createTaskRejectionNotification, createTaskValidationSuccessNotification } from '../../../../../../lib/taskNotifications';

export async function PUT(request, { params }) {
  try {
    const authCheck = await requireAdmin(request);
  if (!authCheck.success) {
    return NextResponse.json(
      { error: authCheck.error || 'Forbidden' },
      { status: authCheck.status || 403 }
    );
  }
    
    const { id } = await params;
    const body = await request.json();
    const { 
      status_submission, 
      admin_notes, 
      verified_by, 
      award_points,
      keterangan 
    } = body;
    
    // Validate submission ID
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'Invalid submission ID' }, { status: 400 });
    }
    
    // Get the submission with task and member details
    const submission = await prisma.task_submissions.findUnique({
      where: { id: Number(id) },
      include: {
        tugas_ai: true,
        members: true
      }
    });
    
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    
    // Prepare update data
    const updateData = {};
    if (status_submission !== undefined) updateData.status_submission = status_submission;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    if (verified_by !== undefined) updateData.verified_by = verified_by;
    if (keterangan !== undefined) updateData.keterangan = keterangan;
    
    // If status is being changed to 'selesai' (completed), set verification date
    if (status_submission === 'selesai' && submission.status_submission !== 'selesai') {
      updateData.tanggal_verifikasi = new Date();
    }
    
    // If status is being changed from 'selesai', remove verification date
    if (status_submission !== 'selesai' && submission.status_submission === 'selesai') {
      updateData.tanggal_verifikasi = null;
    }
    
    // Update the submission
    const updatedSubmission = await prisma.task_submissions.update({
      where: { id: Number(id) },
      data: updateData
    });
    
    // Handle point awarding/removal
    if (award_points !== undefined) {
      const pointsToAward = Number(award_points);
      const currentPoints = submission.members.loyalty_point || 0;
      
      if (pointsToAward !== 0) {
        // Update member points
        await prisma.members.update({
          where: { id: submission.id_member },
          data: {
            loyalty_point: currentPoints + pointsToAward,
            coin: { increment: pointsToAward }
          }
        });
        
        // Log point history
        await prisma.loyalty_point_history.create({
          data: {
            member_id: submission.id_member,
            event: pointsToAward > 0 ? 'task_completion_admin' : 'task_point_adjustment',
            point: pointsToAward,
            comment_id: null,
            event_type: 'admin_adjustment',
            task_id: submission.id_task
          }
        });
      }    }    // Create notification when task is completed or validated with points
    if (status_submission === 'selesai' && submission.status_submission !== 'selesai') {
      const pointsToAward = Number(award_points) || 0;
      
      // If admin awards additional points, use validation success notification
      if (pointsToAward > 0) {
        await createTaskValidationSuccessNotification({
          memberId: submission.id_member,
          points: pointsToAward,
          taskName: submission.tugas_ai?.keyword_tugas
        });
      } else {
        // Otherwise use regular completion notification with task's default points
        await createTaskCompletionNotification(submission, submission.tugas_ai.point_value || 0);
      }
    }
    
    // Create notification when task is rejected
    if (status_submission === 'ditolak' && submission.status_submission !== 'ditolak') {
      await createTaskRejectionNotification(submission, admin_notes);
    }
    
    return NextResponse.json({ 
      success: true, 
      submission: convertBigInt(updatedSubmission),
      points_awarded: award_points || 0
    });
    
  } catch (error) {
    console.error('Error updating task submission:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: 'Submission not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to update submission',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const authCheck = await requireAdmin(request);
  if (!authCheck.success) {
    return NextResponse.json(
      { error: authCheck.error || 'Forbidden' },
      { status: authCheck.status || 403 }
    );
  }
    
    const { id } = await params;
    
    const submission = await prisma.task_submissions.findUnique({
      where: { id: Number(id) },
      include: {
        tugas_ai: {
          select: {
            id: true,
            keyword_tugas: true,
            deskripsi_tugas: true,
            point_value: true
          }
        },
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            foto_profil_url: true,
            loyalty_point: true,
            user_usernames: {
              select: { username: true }
            }
          }
        }
      }
    });
    
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      submission: convertBigInt(submission) 
    });
    
  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch submission',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
