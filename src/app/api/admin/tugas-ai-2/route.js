import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/ssoAuth';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has admin privilege using user_privileges table
    const adminPrivilege = await prisma.user_privileges.findFirst({
      where: { 
        member_id: user.id,
        privilege: 'admin',
        is_active: true,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ]
      }
    });

    if (!adminPrivilege) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') || 1);
    const limit = Number(searchParams.get('limit') || 20);
    const search = searchParams.get('q') || '';

    // Build search conditions
    let whereClause = {};
  
    if (search.trim()) {
      const isNumeric = /^\d+$/.test(search.trim());
      
      if (isNumeric) {
        whereClause.id = parseInt(search.trim());
      } else {
        whereClause.OR = [
          {
            keyword_tugas: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            deskripsi_tugas: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            link_postingan: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ];
      }
    }

    const [tasks, total] = await Promise.all([
      prisma.tugas_ai_2.findMany({ 
        where: whereClause,
        skip: (page - 1) * limit, 
        take: limit, 
        orderBy: { post_timestamp: 'desc' },
        include: {
          tugas_ai_2_screenshots: {
            select: {
              id: true,
              screenshot_url: true,
              uploaded_at: true,
              ai_verification_result: true
            }
          }
        }
      }),
      prisma.tugas_ai_2.count({ where: whereClause })
    ]);

    function convertBigInt(obj) {
      if (Array.isArray(obj)) return obj.map(convertBigInt);
      if (obj && typeof obj === 'object') {
        if (obj instanceof Date) return obj.toISOString();
        
        const out = {};
        for (const k in obj) {
          if (typeof obj[k] === 'bigint') {
            out[k] = Number(obj[k]);
          } else if (obj[k] instanceof Date) {
            out[k] = obj[k].toISOString();
          } else {
            out[k] = convertBigInt(obj[k]);
          }
        }
        return out;
      }
      return obj;
    }

    return NextResponse.json(convertBigInt({ 
      success: true,
      tugas: tasks,
      tasks: tasks,
      total: total,
      hasMore: (page * limit) < total
    }));
  } catch (error) {
    console.error('Error fetching tugas AI 2:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has admin privilege
    const adminPrivilege = await prisma.user_privileges.findFirst({
      where: { 
        member_id: user.id,
        privilege: 'admin',
        is_active: true,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ]
      }
    });

    if (!adminPrivilege) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Validate point_value
    const pointValue = Number(body.point_value) || 10;
    if (isNaN(pointValue) || pointValue < 0 || pointValue > 2147483647) {
      return NextResponse.json({ 
        error: 'Point value must be a valid number between 0 and 2,147,483,647' 
      }, { status: 400 });
    }
    
    // Prepare task data for tugas_ai_2
    const taskData = {
      keyword_tugas: body.keyword_tugas,
      deskripsi_tugas: body.deskripsi_tugas,
      link_postingan: body.link_postingan,
      status: body.status || 'tersedia',
      point_value: pointValue,
      source: body.source || 'manual', // Default to 'manual' for admin-created tasks
      verification_rules: body.verification_rules || {
        required_keywords: [],
        min_confidence: 0.7,
        check_screenshot: true
      }
    };
    
    // Create task in tugas_ai_2 table
    const data = await prisma.tugas_ai_2.create({ 
      data: taskData,
      include: {
        tugas_ai_2_screenshots: true
      }
    });
    
    // TODO: Create notifications for all active members when new task is created
    // We can implement this later when we have the notification system for tugas_ai_2
    
    function convertBigInt(obj) {
      if (Array.isArray(obj)) return obj.map(convertBigInt);
      if (obj && typeof obj === 'object') {
        if (obj instanceof Date) return obj.toISOString();
        
        const out = {};
        for (const k in obj) {
          if (typeof obj[k] === 'bigint') {
            out[k] = Number(obj[k]);
          } else if (obj[k] instanceof Date) {
            out[k] = obj[k].toISOString();
          } else {
            out[k] = convertBigInt(obj[k]);
          }
        }
        return out;
      }
      return obj;
    }
    
    return NextResponse.json(convertBigInt({
      success: true,
      data
    }));
  } catch (error) {
    console.error('Error creating tugas AI 2:', error);
    return NextResponse.json({ 
      error: 'Gagal membuat tugas screenshot',
      details: error.message 
    }, { status: 500 });
  }
}
