import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/debug/leaderboard-photos
 * Debug endpoint to check leaderboard photo data
 */
export async function GET() {
  try {
    // Get loyalty leaderboard with photo data
    const loyaltyRaw = await prisma.peringkat_member_loyalty.findMany({
      orderBy: { peringkat: 'asc' },
      take: 10 // Limit for debugging and since table now contains all data
    });

    const loyaltyMemberIds = loyaltyRaw.map(x => x.id_member).filter(Boolean);

    // Get member profiles with photo data
    const memberProfiles = await prisma.members.findMany({
      where: {
        id: { in: loyaltyMemberIds }
      },
      select: {
        id: true,
        nama_lengkap: true,
        foto_profil_url: true,
        user_usernames: {
          select: {
            username: true,
            display_name: true
          }
        }
      }
    });

    // Debug: Check which members have photos
    const debugData = loyaltyRaw.map(item => {
      const profile = memberProfiles.find(m => m.id === item.id_member);
      return {
        peringkat: item.peringkat,
        id_member: item.id_member,
        nama_lengkap: item.nama_lengkap,
        total_loyalty_point: item.total_loyalty_point,
        profile_found: !!profile,
        profile_data: profile ? {
          foto_profil_url: profile.foto_profil_url,
          foto_profil_exists: !!profile.foto_profil_url,
          foto_profil_url_length: profile.foto_profil_url?.length || 0,
          username: profile.user_usernames?.username || null
        } : null
      };
    });

    // Also check all members with generated photos
    const membersWithPhotos = await prisma.members.findMany({
      where: {
        foto_profil_url: { not: null },
        foto_profil_url: { not: '' }
      },
      select: {
        id: true,
        nama_lengkap: true,
        foto_profil_url: true,
        tanggal_daftar: true
      },
      orderBy: { tanggal_daftar: 'desc' },
      take: 20
    });

    return NextResponse.json({
      success: true,
      debug_info: {
        total_loyalty_entries: loyaltyRaw.length,
        total_member_profiles_found: memberProfiles.length,
        total_members_with_photos: membersWithPhotos.length
      },
      loyalty_leaderboard_debug: debugData,
      recent_members_with_photos: membersWithPhotos.map(m => ({
        id: m.id,
        nama_lengkap: m.nama_lengkap,
        foto_profil_url: m.foto_profil_url,
        foto_url_starts_with: m.foto_profil_url?.substring(0, 50) + '...',
        tanggal_daftar: m.tanggal_daftar
      })),
      sample_photo_urls: membersWithPhotos.slice(0, 3).map(m => m.foto_profil_url)
    });

  } catch (error) {
    console.error('Error in leaderboard photos debug:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
