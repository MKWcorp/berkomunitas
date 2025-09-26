import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { requireAdmin } from '../../../../../lib/requireAdmin';

export async function GET(request) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  // Enhanced query to include category information
  const data = await prisma.$queryRaw`
    SELECT 
      r.*,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color
    FROM rewards r
    LEFT JOIN reward_categories c ON r.category_id = c.id
    ORDER BY c.sort_order ASC NULLS LAST, r.reward_name ASC
  `;
  
  return NextResponse.json({ rewards: data });
}

export async function POST(request) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  const body = await request.json();
  
  // Enhanced create to support new fields
  const rewardData = {
    reward_name: body.reward_name,
    description: body.description,
    point_cost: body.point_cost,
    stock: body.stock || 0,
    foto_url: body.foto_url || null,
    is_active: body.is_active !== false,
    category_id: body.category_id ? parseInt(body.category_id) : null,
    required_privilege: body.required_privilege || null,
    privilege_description: body.privilege_description || null,
    is_exclusive: body.is_exclusive || false
  };
  
  const data = await prisma.rewards.create({ data: rewardData });
  return NextResponse.json(data);
}
