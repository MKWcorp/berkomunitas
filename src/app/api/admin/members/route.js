import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { requireAdmin } from '../../../../../lib/requireAdmin';

export async function GET(req) {
  // Cek admin
  const adminCheck = await requireAdmin(req);
  if (!adminCheck) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ambil data member
  const members = await prisma.members.findMany({
    select: {
      id: true,
      nama_lengkap: true,
      loyalty_point: true,
      nomer_wa: true,
      user_usernames: { select: { username: true } },
      profil_sosial_media: {
        select: {
          platform: true,
          username_sosmed: true,
        },
        take: 1,
      },
      member_emails: {
        select: { email: true },
        where: { is_primary: true },
        take: 1,
      },
    },
    orderBy: { id: 'asc' },
  });

  // Map to flat structure for frontend
  const mapped = members.map(m => ({
    id: m.id,
    nama_lengkap: m.nama_lengkap,
    username: m.user_usernames?.username || '',
    email: m.member_emails?.[0]?.email || '',
    poin: m.loyalty_point,
    sosmed: m.profil_sosial_media?.[0]?.platform || '',
    sosmed_username: m.profil_sosial_media?.[0]?.username_sosmed || '',
    no_wa: m.nomer_wa || '',
  }));

  return NextResponse.json({ members: mapped });
}
