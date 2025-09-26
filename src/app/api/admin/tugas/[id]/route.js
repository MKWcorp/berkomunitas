import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { requireAdmin } from '../../../../../../lib/requireAdmin';
import { convertBigInt } from '../../../../../../lib/bigIntUtils';

export async function GET(request, { params }) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  try {
    const { id } = await params;
    
    // Get task details with submissions and member info
    const task = await prisma.tugas_ai.findUnique({
      where: { id: Number(id) },
      include: {
        task_submissions: {
          include: {
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
          },
          orderBy: {
            tanggal_submission: 'desc'
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Format the response
    const taskDetail = {
      id: task.id,
      keyword_tugas: task.keyword_tugas,
      deskripsi_tugas: task.deskripsi_tugas,
      link_postingan: task.link_postingan,
      point_value: task.point_value,
      status: task.status,
      created_at: task.created_at,
      submissions: task.task_submissions.map(submission => ({
        id: submission.id,
        status_submission: submission.status_submission,
        waktu_klik: submission.waktu_klik,
        tanggal_submission: submission.tanggal_submission,
        tanggal_verifikasi: submission.tanggal_verifikasi,
        admin_notes: submission.admin_notes,
        verified_by: submission.verified_by,
        batas_waktu: submission.batas_waktu,
        keterangan: submission.keterangan,
        member: {
          id: submission.members.id,
          nama_lengkap: submission.members.nama_lengkap,
          foto_profil_url: submission.members.foto_profil_url,
          loyalty_point: submission.members.loyalty_point,
          username: submission.members.user_usernames?.username || `user_${submission.members.id}`
        }
      }))
    };

    return NextResponse.json({ 
      success: true, 
      task: convertBigInt(taskDetail) 
    });

  } catch (error) {
    console.error('Error fetching task details:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch task details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  
  // Validate point_value if provided
  if (body.point_value !== undefined) {
    const pointValue = Number(body.point_value);
    if (isNaN(pointValue) || pointValue < 0 || pointValue > 2147483647) {
      return NextResponse.json({ 
        error: 'Point value must be a valid number between 0 and 2,147,483,647' 
      }, { status: 400 });
    }
  }
  
  const updateData = {};
  if (body.keyword_tugas !== undefined) updateData.keyword_tugas = body.keyword_tugas;
  if (body.deskripsi_tugas !== undefined) updateData.deskripsi_tugas = body.deskripsi_tugas;
  if (body.link_postingan !== undefined) updateData.link_postingan = body.link_postingan;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.point_value !== undefined) updateData.point_value = Number(body.point_value);
  
  const data = await prisma.tugas_ai.update({
    where: { id: Number(id) },
    data: updateData
  });
  
  return NextResponse.json(convertBigInt(data));
}

export async function DELETE(request, { params }) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  
  try {
    const url = new URL(request.url);
    const forceDelete = url.searchParams.get('force') === 'true';
    
    // First check if task exists and get submission count
    const taskWithSubmissions = await prisma.tugas_ai.findUnique({
      where: { id: Number(id) },
      include: {
        task_submissions: {
          select: { id: true }
        }
      }
    });

    if (!taskWithSubmissions) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const submissionCount = taskWithSubmissions.task_submissions.length;

    // If task has submissions and force delete is not requested
    if (submissionCount > 0 && !forceDelete) {
      return NextResponse.json({ 
        error: `Cannot delete task. This task has ${submissionCount} submission(s).`,
        hasSubmissions: true,
        submissionCount: submissionCount,
        message: `Tugas ini memiliki ${submissionCount} submission. Untuk menghapus tugas beserta submissions, gunakan force delete.`
      }, { status: 400 });
    }

    // Use transaction to delete submissions first, then the task
    if (forceDelete && submissionCount > 0) {
      await prisma.$transaction(async (tx) => {
        // Delete all task submissions first
        await tx.task_submissions.deleteMany({
          where: { id_task: Number(id) }
        });

        // Then delete the task
        await tx.tugas_ai.delete({
          where: { id: Number(id) }
        });
      });

      return NextResponse.json({ 
        success: true, 
        message: `Tugas dan ${submissionCount} submission terkait berhasil dihapus`,
        deletedSubmissions: submissionCount
      });
    } else {
      // Delete task with no submissions
      await prisma.tugas_ai.delete({
        where: { id: Number(id) }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Tugas berhasil dihapus' 
      });
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    
    // Handle foreign key constraint error specifically
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Cannot delete task because it has related submissions.',
        constraint: true,
        message: 'Tugas tidak dapat dihapus karena memiliki submission terkait. Gunakan force delete untuk menghapus tugas beserta submissions.'
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Gagal menghapus tugas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
