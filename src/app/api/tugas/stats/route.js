import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '../../../../utils/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get member by clerk_id
    const member = await prisma.members.findUnique({
      where: { clerk_id: userId }
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    // Get total available tasks (real-time from tugas_ai)
    const totalTasks = await prisma.tugas_ai.count({
      where: { status: 'tersedia' }
    });

    // Get or create completed tasks cache for the member
    let memberStats = await prisma.member_task_stats.findUnique({
      where: { member_id: member.id }
    });

    if (!memberStats) {
      // If no stats exist, calculate and create them
      await recalculateCompletedTasks(member.id);
      
      memberStats = await prisma.member_task_stats.findUnique({
        where: { member_id: member.id }
      });
    }

    // Calculate final stats
    const completedTasks = memberStats?.completed_tasks || 0;
    const verifyingTasks = (memberStats?.pending_tasks || 0) + (memberStats?.failed_tasks || 0);
    const incompleteTasks = Math.max(0, totalTasks - completedTasks - verifyingTasks);

    const stats = {
      total: totalTasks,
      completed: completedTasks,
      incomplete: incompleteTasks,
      verifying: verifyingTasks,
      pending: memberStats?.pending_tasks || 0,
      failed: memberStats?.failed_tasks || 0,
      lastUpdated: memberStats?.updated_at || new Date()
    };

    return NextResponse.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('Error fetching task stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task statistics' },
      { status: 500 }
    );
  }
}

// Helper function to recalculate completed tasks for a member
async function recalculateCompletedTasks(memberId) {
  const stats = await prisma.task_submissions.groupBy({
    by: ['status_submission'],
    where: { id_member: memberId },
    _count: { id: true }
  });

  let completedTasks = 0;
  let pendingTasks = 0;
  let failedTasks = 0;

  stats.forEach(stat => {
    const count = stat._count.id;
    
    switch (stat.status_submission) {
      case 'selesai':
        completedTasks += count;
        break;
      case 'sedang_verifikasi':
        pendingTasks += count;
        break;
      case 'gagal_diverifikasi':
        failedTasks += count;
        break;
    }
  });

  // Upsert the stats (only store completed, pending, failed - not total)
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
      total_tasks: 0, // Will be calculated from tugas_ai
      completed_tasks: completedTasks,
      pending_tasks: pendingTasks,
      failed_tasks: failedTasks
    }
  });
}

// POST endpoint to manually refresh stats
export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const member = await prisma.members.findUnique({
      where: { clerk_id: userId }
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    // Force recalculate stats
    await recalculateCompletedTasks(member.id);

    // Get total available tasks (real-time)
    const totalTasks = await prisma.tugas_ai.count({
      where: { status: 'tersedia' }
    });

    // Return updated stats
    const memberStats = await prisma.member_task_stats.findUnique({
      where: { member_id: member.id }
    });

    const completedTasks = memberStats?.completed_tasks || 0;
    const incompleteTasks = Math.max(0, totalTasks - completedTasks);

    const stats = {
      total: totalTasks,
      completed: completedTasks,
      incomplete: incompleteTasks,
      pending: memberStats?.pending_tasks || 0,
      failed: memberStats?.failed_tasks || 0,
      lastUpdated: memberStats?.updated_at || new Date()
    };

    return NextResponse.json({
      success: true,
      stats: stats,
      message: 'Task statistics refreshed successfully'
    });

  } catch (error) {
    console.error('Error refreshing task stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh task statistics' },
      { status: 500 }
    );
  }
}
