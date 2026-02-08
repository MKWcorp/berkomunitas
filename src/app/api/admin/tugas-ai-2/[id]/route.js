import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/ssoAuth';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
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
    
    const taskId = parseInt(resolvedParams.id);
    
    const task = await prisma.tugas_ai_2.findUnique({ 
      where: { id: taskId },
      include: {
        tugas_ai_2_screenshots: {
          select: {
            id: true,
            screenshot_url: true,
            screenshot_filename: true,
            link_komentar: true,
            uploaded_at: true,
            ai_extracted_text: true,
            ai_confidence_score: true,
            ai_verification_result: true
          },
          orderBy: { uploaded_at: 'desc' }
        }
      }
    });
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
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
    
    return NextResponse.json(convertBigInt(task));
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
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
    
    const taskId = parseInt(resolvedParams.id);
    const body = await request.json();
    
    // Validate point_value
    const pointValue = Number(body.point_value) || 10;
    if (isNaN(pointValue) || pointValue < 0 || pointValue > 2147483647) {
      return NextResponse.json({ 
        error: 'Point value must be a valid number between 0 and 2,147,483,647' 
      }, { status: 400 });
    }
    
    const taskData = {
      keyword_tugas: body.keyword_tugas,
      deskripsi_tugas: body.deskripsi_tugas,
      link_postingan: body.link_postingan,
      status: body.status || 'tersedia',
      point_value: pointValue,
      source: body.source || 'manual',
      verification_rules: body.verification_rules || {
        required_keywords: [],
        min_confidence: 0.7,
        check_screenshot: true
      },
      updated_at: new Date()
    };
    
    const data = await prisma.tugas_ai_2.update({ 
      where: { id: taskId },
      data: taskData,
      include: {
        tugas_ai_2_screenshots: true
      }
    });
    
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
    
    return NextResponse.json(convertBigInt(data));
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
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
    
    const taskId = parseInt(resolvedParams.id);
    
    // Delete task (screenshots will be cascade deleted)
    await prisma.tugas_ai_2.delete({ 
      where: { id: taskId }
    });
    
    return NextResponse.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
