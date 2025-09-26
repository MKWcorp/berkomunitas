import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { auth } from '@clerk/nextjs/server';

/**
 * GET /api/tugas
 * Fetches a list of AI tasks for the authenticated member, including submission status and deadlines.
 *
 * Query Parameters:
 * - page (optional): The page number for pagination (default: 1).
 * - limit (optional): The number of items per page (default: 10).
 * - search (optional): A search term to filter tasks by description.
 * - filter (optional): Filter by task status - 'semua', 'selesai', 'belum' (default: 'semua').
 */
export async function GET(request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search');
  const filter = searchParams.get('filter') || 'semua';

  try {
    // Find the member based on the clerkId to get the internal database ID
    const member = await prisma.members.findUnique({
      where: { clerk_id: userId },
      select: { id: true },
    });

    if (!member) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }
    const memberId = member.id;    const whereClause = {
      status: 'tersedia',
      ...(search && {
        deskripsi_tugas: {
          contains: search,
          mode: 'insensitive',
        },
      }),
    };

    // Add server-side filtering based on submission status
    let includeFilter = {
      task_submissions: {
        where: {
          id_member: memberId,
        },
        orderBy: {
          waktu_klik: 'desc',
        },
        take: 1,
      },
    };

    // Apply server-side filtering for completed/incomplete tasks
    if (filter === 'selesai') {
      // Only get tasks that have completed submissions
      whereClause.task_submissions = {
        some: {
          id_member: memberId,
          status_submission: 'selesai',
        },
      };
    } else if (filter === 'belum') {
      // Get tasks that either have no submissions or have failed verification submissions
      // Exclude tasks that are currently being verified (sedang_verifikasi)
      whereClause.OR = [
        // Tasks with no submissions from this member
        {
          task_submissions: {
            none: {
              id_member: memberId,
            },
          },
        },
        // Tasks with submissions that have failed verification
        {
          task_submissions: {
            some: {
              id_member: memberId,
              status_submission: 'gagal_diverifikasi',
            },
          },
        },
      ];
    } else if (filter === 'verifikasi') {
      // Get tasks that are being verified or have failed verification
      whereClause.task_submissions = {
        some: {
          id_member: memberId,
          status_submission: {
            in: ['sedang_verifikasi', 'gagal_diverifikasi'],
          },
        },
      };
    }

    // Fetch tasks with conditional inclusion of submissions for the specific member
    const tasksFromDb = await prisma.tugas_ai.findMany({
      where: whereClause,
      include: includeFilter,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        post_timestamp: 'desc',
      },
    });

    // Helper function to convert BigInt fields in an object
    const convertBigIntsInObject = (obj) => {
        const newObj = {};
        for (const key in obj) {
            if (typeof obj[key] === 'bigint') {
                newObj[key] = Number(obj[key]);
            } else {
                newObj[key] = obj[key];
            }
        }
        return newObj;
    };

    // Process tasks to add status and deadline, and convert BigInts
    const tasks = tasksFromDb.map(task => {
      const submission = task.task_submissions[0];
      const status_submission = submission ? submission.status_submission : 'tersedia';

      let batas_waktu = null;
      if (status_submission === 'sedang_verifikasi' && submission?.waktu_klik) {
        const waktuKlik = new Date(submission.waktu_klik);
        waktuKlik.setHours(waktuKlik.getHours() + 4); // Changed to 4 hours
        batas_waktu = waktuKlik.toISOString();
      }

      // Clean up the response object
      const { task_submissions, ...restOfTask } = task;

      const processedTask = {
        ...restOfTask,
        status_submission,
        batas_waktu,
      };

      // Convert any BigInts in the final task object
      return convertBigIntsInObject(processedTask);
    });
      // Get total count for pagination metadata (using same filter conditions)
    const totalTasks = await prisma.tugas_ai.count({ where: whereClause });

    return NextResponse.json({
      success: true,
      tasks,
      memberId: memberId, // Add memberId to the response
      pagination: {
        page,
        limit,
        totalTasks,
        totalPages: Math.ceil(totalTasks / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching AI tasks:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
