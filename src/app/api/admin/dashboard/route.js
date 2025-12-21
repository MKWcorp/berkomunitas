import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/ssoAuth';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privilege using user_privileges table
    const adminPrivilege = await prisma.user_privileges.findFirst({
      where: { member_id: user.id,
        privilege: 'admin',
        is_active: true,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ]
      }
    });

    if (!adminPrivilege) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Ambil statistik global
    const statistik_global = await prisma.statistik_global.findMany();
    // Ambil statistik harian 30 hari terakhir
    const statistik_harian = await prisma.statistik_harian.findMany({ orderBy: { tanggal: 'desc' }, take: 30 });
    
    // Total tugas
    const total_tugas = await prisma.tugas_ai.count();
    // Total hadiah
    const total_hadiah = await prisma.rewards.count();
    // Total lencana
    const total_lencana = await prisma.badges.count();
    
    // Total komentar dari statistik_global
    const total_komentar_global = await prisma.statistik_global.findUnique({
      where: { nama_statistik: 'total_seluruh_komentar' }
    });
    const total_komentar = total_komentar_global?.nilai_statistik || 0;
    
    // Total loyalty dari members.loyalty_point
    const total_loyalty = await prisma.members.aggregate({
      _sum: { loyalty_point: true }
    });
    
    // Total coin dari members.coin
    const total_coin = await prisma.members.aggregate({
      _sum: { coin: true }
    });

    // Gunakan data statistik_harian untuk chart yang lebih akurat
    const chart_data = statistik_harian.map(stat => ({
      tanggal: stat.tanggal,
      total_komentar_harian: stat.total_komentar_baru || 0,
      total_loyalty_harian: stat.total_poin_diberikan || 0
    }));

    // Peringkat (admin overview - keep limited for performance)
    const peringkat_comments = await prisma.peringkat_member_comments.findMany({
      orderBy: { peringkat: 'asc' },
      take: 10  // Admin overview - show top 10 only
    });
    const peringkat_loyalty = await prisma.peringkat_member_loyalty.findMany({
      orderBy: { peringkat: 'asc' },
      take: 10  // Admin overview - show top 10 only
    });
    const peringkat_tugas = await prisma.peringkat_tugas_populer.findMany();
    const peringkat_sumber = await prisma.peringkat_sumber_tugas.findMany();

    console.log('Dashboard data:', {
      total_tugas,
      total_hadiah,
      total_lencana,
      total_komentar,
      total_loyalty: total_loyalty._sum.loyalty_point || 0,
      total_coin: total_coin._sum.coin || 0,
      chart_data: chart_data?.length,
      statistik_harian: statistik_harian?.length
    });

    function convertBigInt(obj) {
      if (Array.isArray(obj)) return obj.map(convertBigInt);
      if (obj && typeof obj === 'object') {
        // Jangan convert Date
        if (obj instanceof Date) return obj;
        const out = {};
        for (const k in obj) {
          if (typeof obj[k] === 'bigint') {
            out[k] = Number(obj[k]);
          } else {
            out[k] = convertBigInt(obj[k]);
          }
        }
        return out;
      }
      return obj;
    }

    return NextResponse.json(convertBigInt({
      statistik_global,
      statistik_harian,
      total_tugas,
      total_hadiah,
      total_lencana,
      total_komentar,
      total_loyalty: total_loyalty._sum.loyalty_point || 0,
      total_coin: total_coin._sum.coin || 0,
      chart_data,
      peringkat_comments,
      peringkat_loyalty,
      peringkat_tugas,
      peringkat_sumber
    }));
  } catch (___error) {
    console.error('Dashboard API error:', ___error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
