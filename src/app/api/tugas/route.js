import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/ssoAuth';

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
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search');
  const filter = searchParams.get('filter') || 'semua';

  try {
    // Find the member based on email, google_id, or clerk_id
    const member = await prisma.members.findFirst({
      where: {
        OR: [
          { email: user.email },
          { google_id: user.google_id },
          user.clerk_id ? { google_id: user.clerk_id } : { id: user.id }
        ].filter(Boolean)
      },
      select: { id: true },
    });

    if (!member) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }
    const memberId = member.id;const whereClause = {
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

    // Fetch tasks from both tables
    const [tasksAiFromDb, tasksAi2FromDb] = await Promise.all([
      // tugas_ai (auto-verify tasks)
      prisma.tugas_ai.findMany({
        where: whereClause,
        include: includeFilter,
        orderBy: {
          post_timestamp: 'desc',
        },
      }),
      // tugas_ai_2 (screenshot tasks)
      prisma.tugas_ai_2.findMany({
        where: {
          status: 'tersedia',
          ...(search && {
            deskripsi_tugas: {
              contains: search,
              mode: 'insensitive',
            },
          }),
        },
        select: {
          id: true,
          keyword_tugas: true,
          deskripsi_tugas: true,
          link_postingan: true,
          status: true,
          point_value: true,
          source: true,
          verification_rules: true,
          post_timestamp: true,
          created_at: true,
          updated_at: true,
          tugas_ai_2_screenshots: {
            where: {
              member_id: memberId,
            },
            orderBy: {
              uploaded_at: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          post_timestamp: 'desc',
        },
      }),
    ]);

    // Collect all task_submission_ids from screenshots
    const taskSubmissionIds = tasksAi2FromDb
      .flatMap(task => task.tugas_ai_2_screenshots)
      .map(s => s.task_submission_id)
      .filter(id => id != null);

    // Query task_submissions for these IDs that belong to current user
    const userTaskSubmissions = taskSubmissionIds.length > 0 
      ? await prisma.task_submissions.findMany({
          where: {
            id: { in: taskSubmissionIds },
            id_member: memberId,
          },
          select: {
            id: true,
            id_task: true,
            status_submission: true,
            waktu_klik: true,
          },
        })
      : [];

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

    // Process tugas_ai (auto-verify) tasks
    const processedTasksAi = tasksAiFromDb.map(task => {
      const submission = task.task_submissions[0];
      const status_submission = submission ? submission.status_submission : 'tersedia';

      let batas_waktu = null;
      if (status_submission === 'sedang_verifikasi' && submission?.waktu_klik) {
        const waktuKlik = new Date(submission.waktu_klik);
        waktuKlik.setHours(waktuKlik.getHours() + 4);
        batas_waktu = waktuKlik.toISOString();
      }

      const { task_submissions, ...restOfTask } = task;

      const processedTask = {
        ...restOfTask,
        task_type: 'auto',
        status_submission,
        batas_waktu,
      };

      return convertBigIntsInObject(processedTask);
    });

    // Process tugas_ai_2 (screenshot) tasks
    const processedTasksAi2 = tasksAi2FromDb.map(task => {
      // Find screenshot from this user by member_id (already filtered in query)
      const userScreenshot = task.tugas_ai_2_screenshots[0];
      
      // Determine status based on screenshot status field
      let status_submission = 'tersedia';
      
      if (userScreenshot) {
        // Map screenshot status to task status
        switch (userScreenshot.status) {
          case 'sedang_verifikasi':
            status_submission = 'sedang_verifikasi';
            break;
          case 'selesai':
            status_submission = 'selesai';
            break;
          case 'gagal_diverifikasi':
            status_submission = 'gagal_diverifikasi';
            break;
          default:
            status_submission = 'sedang_verifikasi';
        }
      }

      let batas_waktu = null;
      if (status_submission === 'sedang_verifikasi' && userScreenshot?.uploaded_at) {
        const uploadTime = new Date(userScreenshot.uploaded_at);
        uploadTime.setHours(uploadTime.getHours() + 4);
        batas_waktu = uploadTime.toISOString();
      }

      const { tugas_ai_2_screenshots, ...restOfTask } = task;

      const processedTask = {
        ...restOfTask,
        task_type: 'screenshot',
        status_submission,
        batas_waktu,
        screenshot_data: userScreenshot ? {
          id: userScreenshot.id,
          url: userScreenshot.screenshot_url,
          uploaded_at: userScreenshot.uploaded_at,
          status: userScreenshot.status,
        } : null,
      };

      return convertBigIntsInObject(processedTask);
    });

    // Combine both task types
    let allTasks = [...processedTasksAi, ...processedTasksAi2];
    
    // Sort by post_timestamp descending
    allTasks.sort((a, b) => new Date(b.post_timestamp) - new Date(a.post_timestamp));
    
    // Apply client-side filter for combined tasks from both tables
    if (filter === 'selesai') {
      allTasks = allTasks.filter(t => t.status_submission === 'selesai');
    } else if (filter === 'belum') {
      allTasks = allTasks.filter(t => t.status_submission === 'tersedia' || t.status_submission === 'gagal_diverifikasi');
    } else if (filter === 'verifikasi') {
      // Include tasks being verified (from both task_submissions and tugas_ai_2_screenshots)
      allTasks = allTasks.filter(t => t.status_submission === 'sedang_verifikasi' || t.status_submission === 'gagal_diverifikasi');
    } else if (filter === 'gagal') {
      allTasks = allTasks.filter(t => t.status_submission === 'gagal_diverifikasi');
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const tasks = allTasks.slice(startIndex, endIndex);
    const totalTasks = allTasks.length;

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
