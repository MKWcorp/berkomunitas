import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
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
  
  // Ensure required fields have default values
  const badgeData = {
    badge_name: body.badge_name,
    description: body.description,
    criteria_type: body.criteria_type || 'manual',
    criteria_value: Number(body.criteria_value) || 0,
    badge_color: body.badge_color || 'blue',
    badge_style: body.badge_style || 'flat',
    badge_message: body.badge_message || 'Achievement'
  };
  
  const data = await prisma.badges.update({ where: { id: Number(id) }, data: badgeData });
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
  await prisma.badges.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
