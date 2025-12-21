import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '../../../../../lib/requireAdmin';

export async function GET(request) {
  const authCheck = await requireAdmin(request);
  if (!authCheck.success) {
    return NextResponse.json(
      { error: authCheck.error || 'Forbidden' },
      { status: authCheck.status || 403 }
    );
  }
  const data = await prisma.levels.findMany();
  return NextResponse.json(data);
}
export async function POST(request) {
  const authCheck = await requireAdmin(request);
  if (!authCheck.success) {
    return NextResponse.json(
      { error: authCheck.error || 'Forbidden' },
      { status: authCheck.status || 403 }
    );
  }
  const body = await request.json();
  
  try {
    // Check if level_number already exists
    const existingLevelNumber = await prisma.levels.findUnique({
      where: { level_number: Number(body.level_number) }
    });
    
    if (existingLevelNumber) {
      return NextResponse.json({ 
        error: `Level ${body.level_number} sudah ada` 
      }, { status: 400 });
    }
    
    // Check if required_points already exists
    const existingRequiredPoints = await prisma.levels.findUnique({
      where: { required_points: Number(body.required_points) }
    });
    
    if (existingRequiredPoints) {
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
    
    const data = await prisma.levels.create({ data: levelData });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating level:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Level atau poin yang dibutuhkan sudah ada' 
      }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal membuat level' }, { status: 500 });
  }
}
