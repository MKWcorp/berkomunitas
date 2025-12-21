import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { getCurrentUser } from '@/lib/ssoAuth';

// GET /api/admin/tugas/stats - Get task statistics
export async function GET(request) {
  try {
    console.log('GET /api/admin/tugas/stats - Starting...');
    
    // Get current user from Clerk for admin authentication
    const user = await getCurrentUser(request);
    console.log('GET /api/admin/tugas/stats - Clerk user:', user?.id);
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized - No user authenticated' }, { status: 401 });
    }

    // Check if user has admin privileges using clerk_id
    const adminPrivilege = await prisma.user_privileges.findFirst({
      where: { google_id: user.id, 
        privilege: 'admin', 
        is_active: true 
      }
    });

    console.log('GET /api/admin/tugas/stats - Admin privilege found:', adminPrivilege ? 'Yes' : 'No');

    if (!adminPrivilege) {
      console.log('GET /api/admin/tugas/stats - Access denied: Not admin');
      return NextResponse.json({ 
        error: 'Forbidden: Admin access required',
        debug: {
          google_id: user.id,
          has_admin_privilege: !!adminPrivilege
        }
      }, { status: 403 });
    }

    // Get task statistics
    const stats = await Promise.all([
      // 1. Total Jumlah Tugas (count dari tabel tugas_ai)
      prisma.tugas_ai.count(),
      
      // 2. Total Tugas Sedang diverifikasi (count tabel task_submissions dengan status "sedang_verifikasi")
      prisma.task_submissions.count({
        where: {
          status_submission: 'sedang_verifikasi'
        }
      }),
      
      // 3. Total Tugas Gagal (count tabel task_submissions dengan status "gagal_diverifikasi")
      prisma.task_submissions.count({
        where: {
          status_submission: 'gagal_diverifikasi'
        }
      }),
      
      // 4. Berhasil Diverifikasi - use "selesai" status instead of "verified"
      prisma.task_submissions.count({
        where: {
          status_submission: 'selesai'
        }
      })
    ]);

    const [
      totalTugas,
      sedangDiverifikasi,
      gagalDiverifikasi,
      verified
    ] = stats;

    console.log('GET /api/admin/tugas/stats - Stats calculated:', {
      totalTugas,
      sedangDiverifikasi,
      gagalDiverifikasi,
      verified
    });

    return NextResponse.json({
      total_tugas: totalTugas,
      sedang_diverifikasi: sedangDiverifikasi,
      gagal_diverifikasi: gagalDiverifikasi,
      verified: verified,
      total_submissions: sedangDiverifikasi + gagalDiverifikasi + verified
    });

  } catch (error) {
    console.error('GET /api/admin/tugas/stats error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
