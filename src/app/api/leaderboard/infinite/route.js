import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/leaderboard/infinite?type=loyalty|comments&page=1&limit=50
 * Endpoint khusus untuk infinite scroll leaderboard
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'loyalty'; // 'loyalty' or 'comments'
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;

    let data = [];
    let hasMore = false;

    if (type === 'loyalty') {
      // Fetch loyalty leaderboard
      const loyaltyRaw = await prisma.peringkat_member_loyalty.findMany({
        orderBy: { peringkat: 'asc' },
        skip: skip,
        take: limit + 1 // Take one extra to check if there's more
      });

      hasMore = loyaltyRaw.length > limit;
      if (hasMore) loyaltyRaw.pop(); // Remove the extra item

      // Get member profiles
      const loyaltyMemberIds = loyaltyRaw.map(x => x.id_member).filter(Boolean);
      const loyaltyProfiles = await prisma.members.findMany({
        where: { id: { in: loyaltyMemberIds } },
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

      // Create profile lookup
      const profileLookup = {};
      loyaltyProfiles.forEach(profile => {
        profileLookup[profile.id] = profile;
      });

      // Combine data
      data = loyaltyRaw.map(item => {
        const profile = profileLookup[item.id_member];
        return {
          ...item,
          foto_profil_url: profile?.foto_profil_url || null,
          nama_lengkap: profile?.nama_lengkap || item.nama_lengkap,
          username: profile?.user_usernames?.username || null,
          display_name: profile?.user_usernames?.display_name || null,
        };
      });

    } else if (type === 'comments') {
      // Fetch comments leaderboard
      const commentRaw = await prisma.peringkat_member_comments.findMany({
        orderBy: { peringkat: 'asc' },
        skip: skip,
        take: limit + 1 // Take one extra to check if there's more
      });

      hasMore = commentRaw.length > limit;
      if (hasMore) commentRaw.pop(); // Remove the extra item

      // Get usernames and member profiles
      const commentUsernames = commentRaw.map(x => x.username_sosmed).filter(Boolean);
      const usernameProfiles = await prisma.user_usernames.findMany({
        where: { username: { in: commentUsernames } },
        include: {
          members: {
            select: {
              id: true,
              nama_lengkap: true,
              foto_profil_url: true
            }
          }
        }
      });

      // Create profile lookup
      const profileLookup = {};
      usernameProfiles.forEach(profile => {
        profileLookup[profile.username] = profile;
      });

      // Combine data
      data = commentRaw.map(item => {
        const profile = profileLookup[item.username_sosmed];
        const member = profile?.members;
        return {
          ...item,
          foto_profil_url: member?.foto_profil_url || null,
          nama_lengkap: member?.nama_lengkap || item.nama_tampilan,
          username: profile?.username || null,
          display_name: profile?.display_name || null,
        };
      });
    }

    return NextResponse.json({
      success: true,
      data: data,
      pagination: {
        page,
        limit,
        hasMore,
        total: data.length,
        type
      },
      lastUpdate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching infinite scroll leaderboard:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch leaderboard data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
