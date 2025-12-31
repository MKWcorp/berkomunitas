import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '../../../../../../lib/requireAdmin';

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
    const { privilege, is_active, granted_by, expires_at } = body;
    
    // Validate ID
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'Invalid privilege ID' }, { status: 400 });
    }
    
    // Validate required fields
    if (!privilege) {
      return NextResponse.json({ error: 'Privilege is required' }, { status: 400 });
    }
    
    // Prepare update data
    const updateData = {
      privilege,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
    };
    
    // Add optional fields if provided
    if (granted_by !== undefined) updateData.granted_by = granted_by;
    if (expires_at !== undefined) updateData.expires_at = expires_at ? new Date(expires_at) : null;
    
    // Check if privilege exists first
    const existingPrivilege = await prisma.user_privileges.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existingPrivilege) {
      return NextResponse.json({ error: 'Privilege not found' }, { status: 404 });
    }
    
    // Update privilege
    const updated = await prisma.user_privileges.update({
      where: { id: Number(id) },
      data: updateData
    });

    function convertBigInt(obj) {
      if (Array.isArray(obj)) return obj.map(convertBigInt);
      if (obj && typeof obj === 'object') {
        const out = {};
        for (const k in obj) out[k] = typeof obj[k] === 'bigint' ? Number(obj[k]) : convertBigInt(obj[k]);
        return out;
      }
      return obj;
    }

    return NextResponse.json({ 
      success: true, 
      privilege: convertBigInt(updated) 
    });
    
  } catch (error) {
    console.error('Error updating privilege:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Privilege with this name already exists' 
      }, { status: 400 });
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: 'Privilege not found' 
      }, { status: 404 });
    }
    
    // Handle connection errors
    if (error.code === 'ECONNRESET' || error.message.includes('ECONNRESET')) {
      return NextResponse.json({ 
        error: 'Database connection error. Please try again.' 
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to update privilege',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const authCheck = await requireAdmin(request);
  if (!authCheck.success) {
    return NextResponse.json(
      { error: authCheck.error || 'Forbidden' },
      { status: authCheck.status || 403 }
    );
  }
    
    const { id } = await params;
    
    // Validate ID
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'Invalid privilege ID' }, { status: 400 });
    }
    
    // Check if privilege exists first
    const existingPrivilege = await prisma.user_privileges.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existingPrivilege) {
      return NextResponse.json({ error: 'Privilege not found' }, { status: 404 });
    }
    
    // Delete privilege
    await prisma.user_privileges.delete({ 
      where: { id: Number(id) } 
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting privilege:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: 'Privilege not found' 
      }, { status: 404 });
    }
    
    // Handle connection errors
    if (error.code === 'ECONNRESET' || error.message.includes('ECONNRESET')) {
      return NextResponse.json({ 
        error: 'Database connection error. Please try again.' 
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to delete privilege',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
