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
  
  const privileges = await prisma.user_privileges.findMany({
    include: {
      members: {
        select: {
          id: true,
          nama_lengkap: true,
          email: true,
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
  const authCheck = await requireAdmin(request);
  if (!authCheck.success) {
    return NextResponse.json(
      { error: authCheck.error || 'Forbidden' },
      { status: authCheck.status || 403 }
    );
  }
  
  const { email, privilege, is_active } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email diperlukan' }, { status: 400 });
  }

  // Get member from email (check both members.email and member_emails)
  let member = await prisma.members.findUnique({
    where: { email: email }
  });
  
  if (!member) {
    // Try to find via member_emails
    const memberEmail = await prisma.member_emails.findUnique({
      where: { email: email },
      include: { members: true }
    });
    member = memberEmail?.members;
  }
  
  if (!member) {
    return NextResponse.json({ error: 'Member dengan email tersebut tidak ditemukan' }, { status: 400 });
  }
  
  // Check if privilege already exists for this member
  const existing = await prisma.user_privileges.findFirst({
    where: { member_id: member.id, privilege }
  });
  
  if (existing) {
    return NextResponse.json({ error: 'Privilege sudah ada untuk member ini' }, { status: 400 });
  }
  
  const newPrivilege = await prisma.user_privileges.create({
    data: {
      member_id: member.id,
      privilege,
      is_active: is_active ?? true,
      granted_at: new Date()
    },
    include: {
      members: {
        select: {
          id: true,
          nama_lengkap: true,
          email: true
        }
      }
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
