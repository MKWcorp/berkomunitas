import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { requireAdmin } from '../../../../../lib/requireAdmin';

export async function GET(request) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const data = await prisma.badges.findMany();
  return NextResponse.json({ badges: data });
}
export async function POST(request) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
  
  const data = await prisma.badges.create({ data: badgeData });
  return NextResponse.json(data);
}
