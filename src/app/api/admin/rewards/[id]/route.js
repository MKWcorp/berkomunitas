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
  
  // Enhanced update to support new fields
  const updateData = {
    reward_name: body.reward_name,
    description: body.description,
    point_cost: body.point_cost,
    stock: body.stock,
    foto_url: body.foto_url,
    is_active: body.is_active !== false,
    category_id: body.category_id ? parseInt(body.category_id) : null,
    required_privilege: body.required_privilege || null,
    privilege_description: body.privilege_description || null,
    is_exclusive: body.is_exclusive || false
  };
  
  const data = await prisma.rewards.update({ 
    where: { id: Number(id) }, 
    data: updateData 
  });
  return NextResponse.json(data);
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
  await prisma.rewards.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
