import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

// Helper function to convert BigInt values to regular numbers
function convertBigIntToNumber(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigIntToNumber);
  if (typeof obj === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToNumber(value);
    }
    return converted;
  }
  return obj;
}

export async function GET(request, { params }) {
  try {
    const { id } = await params; // Await params for Next.js 15+
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    // Validate task ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        success: false,
        error: 'Invalid task ID'
      }, { status: 400 });
    }

    const taskId = parseInt(id);

    // Always fetch all members who have completed this task, ordered by loyalty point
    const completedMembers = await prisma.task_submissions.findMany({
      where: {
        id_task: taskId,
        status_submission: 'selesai',
      },
      include: {
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            loyalty_point: true,
            user_usernames: { select: { username: true, display_name: true } },
            foto_profil_url: true,
          },
        },
      },
    });

    // Sort by loyalty_point descending
    completedMembers.sort((a, b) => (b.members?.loyalty_point || 0) - (a.members?.loyalty_point || 0));

    // Map to clean output
    const memberList = completedMembers.map((item) => ({
      id: item.members?.id,
      nama_lengkap: item.members?.nama_lengkap,
      loyalty_point: item.members?.loyalty_point,
      username: item.members?.user_usernames?.username,
      display_name: item.members?.user_usernames?.display_name,
      foto_profil_url: item.members?.foto_profil_url,
      tanggal_selesai: item.tanggal_verifikasi ? new Date(item.tanggal_verifikasi).toISOString() : null,
    }));

    // Fetch task detail (with/without memberId)
    let task, submission, status_submission, batas_waktu, submission_timestamp, completion_timestamp;
    if (memberId) {
      const taskWithSubmission = await prisma.tugas_ai.findUnique({
        where: { id: taskId },
        include: {
          task_submissions: {
            where: { id_member: parseInt(memberId) },
            select: {
              status_submission: true,
              batas_waktu: true,
              tanggal_submission: true,
              tanggal_verifikasi: true
            }
          }
        }
      });
      if (!taskWithSubmission) {
        return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
      }
      submission = taskWithSubmission.task_submissions[0];
      status_submission = submission?.status_submission || 'tersedia';
      batas_waktu = submission?.batas_waktu || null;
      submission_timestamp = submission?.tanggal_submission || null;
      completion_timestamp = submission?.tanggal_verifikasi || null;
      task = { ...taskWithSubmission };
      delete task.task_submissions;
    } else {
      task = await prisma.tugas_ai.findUnique({ where: { id: taskId } });
      if (!task) {
        return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
      }
      status_submission = 'tersedia';
      batas_waktu = null;
      submission_timestamp = null;
      completion_timestamp = null;
    }

    // Pastikan post_timestamp string
    let post_timestamp = null;
    if (task && task.post_timestamp) {
      post_timestamp = typeof task.post_timestamp === 'string' ? task.post_timestamp : new Date(task.post_timestamp).toISOString();
    }
    return NextResponse.json({
      success: true,
      task: convertBigIntToNumber({
        ...task,
        post_timestamp,
        status_submission,
        batas_waktu,
        submission_timestamp,
        completion_timestamp,
        completed_members: memberList,
      })
    });
  } catch (error) {
    console.error('Error fetching task details:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
