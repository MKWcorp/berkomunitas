import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '../../../../../../lib/requireAdmin';

export async function PUT(request, { params }) {
  const authCheck = await requireAdmin(request);
  if (!authCheck.success) {
    return NextResponse.json(
      { error: authCheck.error || 'Forbidden' },
      { status: authCheck.status || 403 }
    );
  }
  const { id } = await params;
  const body = await request.json();
  
  // Validate that id is not undefined
  if (!id || id === 'undefined') {
    return NextResponse.json({ error: 'Invalid level ID' }, { status: 400 });
  }
  
  try {
    // Check if required_points is already used by another level
    const existingLevel = await prisma.levels.findUnique({
      where: { required_points: Number(body.required_points) }
    });
    
    // If found and it's not the current level being updated, return error
    if (existingLevel && existingLevel.level_number !== Number(id)) {
      return NextResponse.json({ 
        error: `Poin yang dibutuhkan (${body.required_points}) sudah digunakan oleh level lain` 
      }, { status: 400 });
    }
    
    // Only include fields that exist in the levels table
    const levelData = {
      level_number: Number(body.level_number),
      level_name: body.level_name,
      required_points: Number(body.required_points)
    };
    
    const data = await prisma.levels.update({ 
      where: { level_number: Number(id) }, 
      data: levelData 
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating level:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Poin yang dibutuhkan sudah digunakan oleh level lain' 
      }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal mengupdate level' }, { status: 500 });
  }
}
export async function DELETE(request, { params }) {
  const authCheck = await requireAdmin(request);
  if (!authCheck.success) {
    return NextResponse.json(
      { error: authCheck.error || 'Forbidden' },
      { status: authCheck.status || 403 }
    );
  }
  const { id } = await params;
  
  // Validate that id is not undefined
  if (!id || id === 'undefined') {
    return NextResponse.json({ error: 'Invalid level ID' }, { status: 400 });
  }
  
  await prisma.levels.delete({ where: { level_number: Number(id) } });
  return NextResponse.json({ success: true });
}
