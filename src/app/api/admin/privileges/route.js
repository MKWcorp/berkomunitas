import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { requireAdmin } from '../../../../../lib/requireAdmin';

export async function GET(request) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  const privileges = await prisma.user_privileges.findMany({
    include: {
      members: {
        include: {
          member_emails: {
            select: {
              email: true
            },
            take: 1
          }
        }
      }
    },
    orderBy: { granted_at: 'desc' }
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

  return NextResponse.json(convertBigInt(privileges));
}

export async function POST(request) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  const { clerk_id, privilege, is_active } = await request.json();

  // Get member from clerk_id
  const member = await prisma.members.findUnique({
    where: { clerk_id: clerk_id }
  });
  
  if (!member) {
    return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 400 });
  }
  
  // Check if privilege already exists for this user
  const existing = await prisma.user_privileges.findFirst({
    where: { clerk_id: clerk_id, privilege }
  });
  
  if (existing) {
    return NextResponse.json({ error: 'Privilege sudah ada untuk user ini' }, { status: 400 });
  }
  
  const newPrivilege = await prisma.user_privileges.create({
    data: {
      clerk_id: clerk_id, // Gunakan clerk_id sesuai schema yang baru
      privilege,
      is_active: is_active ?? true,
      granted_at: new Date()
    }
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

  return NextResponse.json(convertBigInt(newPrivilege), { status: 201 });
}
