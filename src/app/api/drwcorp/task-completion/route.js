import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

// GET /api/drwcorp/task-completion - Get task completion for employees
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const divisi = searchParams.get('divisi');

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'taskId is required' },
        { status: 400 }
      );
    }

    // Get task info
    const task = await prisma.tugas_ai.findUnique({
      where: { id: Number(taskId) },
      select: {
        id: true,
        keyword_tugas: true,
        deskripsi_tugas: true,
        link_postingan: true,
        point_value: true,
        status: true
      }
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Get all employees (with optional divisi filter)
    const where = {};
    if (divisi && divisi !== 'all') {
      where.divisi = divisi;
    }

    const employees = await prisma.drwcorp_employees.findMany({
      where,
      include: {
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            email: true,
            task_submissions: {
              where: {
                id_task: Number(taskId)
              },
              select: {
                id: true,
                status_submission: true,
                tanggal_submission: true,
                waktu_klik: true
              }
            }
          }
        }
      },
      orderBy: [
        { divisi: 'asc' },
        { nama_lengkap: 'asc' }
      ]
    });

    // Categorize employees
    const completed = [];
    const notCompleted = [];

    for (const emp of employees) {
      // Check if employee has member link and submission
      const hasSubmission = emp.members?.task_submissions?.length > 0;
      const submission = hasSubmission ? emp.members.task_submissions[0] : null;
      
      const employeeData = {
        id: emp.id,
        nama_lengkap: emp.nama_lengkap,
        email: emp.email,
        divisi: emp.divisi,
        matching_status: emp.matching_status,
        member_id: emp.member_id,
        member_nama: emp.members?.nama_lengkap || null,
        submission: submission
      };

      // Only consider "completed" if:
      // 1. Has member link (matched)
      // 2. Has submission
      // 3. Submission status is 'selesai'
      if (hasSubmission && submission.status_submission === 'selesai') {
        completed.push(employeeData);
      } else {
        // All others go to "not completed" including:
        // - Unmatched employees (no member link)
        // - Ambiguous employees (no member link)
        // - Matched but no submission yet
        notCompleted.push(employeeData);
      }
    }

    // Statistics
    const statistics = {
      total_employees: employees.length,
      completed_count: completed.length,
      not_completed_count: notCompleted.length,
      completion_rate: employees.length > 0 
        ? Math.round((completed.length / employees.length) * 100) 
        : 0,
      matched_employees: employees.filter(e => e.matching_status === 'matched').length,
      unmatched_employees: employees.filter(e => e.matching_status === 'unmatched').length
    };

    return NextResponse.json({
      success: true,
      task,
      completed,
      notCompleted,
      statistics
    });

  } catch (error) {
    console.error('Error fetching task completion:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
