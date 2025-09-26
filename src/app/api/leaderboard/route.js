import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '../../../../lib/prisma.js';

export const dynamic = 'force-dynamic';

// Cache settings
let lastFetch = 0;
let cachedData = null;
const CACHE_DURATION = 30000; // 30 seconds cache

/**
 * GET /api/leaderboard
 * Fetches leaderboard data with user rankings
 * Maintains backward compatibility with existing frontend
 */
export async function GET() {
  try {
    let loyaltyRaw = [];
    let commentRaw = [];

    // Ambil leaderboard loyalitas dari tabel peringkat_member_loyalty
    try {
      loyaltyRaw = await prisma.peringkat_member_loyalty.findMany({
        orderBy: { peringkat: 'asc' },
        take: 50  // Default limit for backward compatibility
      });
    } catch (dbError) {
      console.error('Error fetching loyalty leaderboard:', dbError);
      loyaltyRaw = [];
    }

    // Ambil leaderboard komentar dari tabel peringkat_member_comments  
    try {
      commentRaw = await prisma.peringkat_member_comments.findMany({
        orderBy: { peringkat: 'asc' },
        take: 50  // Default limit for backward compatibility
      });
    } catch (dbError) {
      console.error('Error fetching comments leaderboard:', dbError);
      commentRaw = [];
    }

    // Ambil semua id_member unik dari leaderboard loyalitas
    const loyaltyMemberIds = loyaltyRaw.map(x => x.id_member).filter(Boolean);
    // Ambil semua username_sosmed unik dari leaderboard komentar
    const commentUsernames = commentRaw.map(x => x.username_sosmed).filter(Boolean);

    // Query profil member untuk leaderboard loyalitas
    const loyaltyProfiles = await prisma.members.findMany({
      where: {
        id: { in: loyaltyMemberIds }
      },
      include: {
        user_usernames: true
      }
    });

    // Query profil member untuk leaderboard komentar (berdasarkan username_sosmed di profil_sosial_media)
    const commentProfiles = await prisma.profil_sosial_media.findMany({
      where: {
        username_sosmed: { in: commentUsernames }
      },
      include: {
        members: {
          include: {
            user_usernames: true
          }
        }
      }
    });

    // Helper untuk ambil profil dari id_member
    function getLoyaltyProfile(id_member) {
      return loyaltyProfiles.find(m => m.id === id_member);
    }
    // Helper untuk ambil profil dari username_sosmed
    function getCommentProfile(username_sosmed) {
      return commentProfiles.find(p => p.username_sosmed === username_sosmed);
    }

    // Gabungkan data profil ke loyalty leaderboard
    const loyaltyLeaderboard = loyaltyRaw.map(item => {
      const profile = getLoyaltyProfile(item.id_member);
      const usernameObj = profile?.user_usernames || null;
      return {
        ...item,
        loyalty_point: item.total_loyalty_point,
        foto_profil_url: profile?.foto_profil_url || null,
        nama_lengkap: profile?.nama_lengkap || item.nama_lengkap,
        username: usernameObj?.username || null,
        display_name: usernameObj?.display_name || null,
      };
    });

    // Gabungkan data profil ke comment leaderboard dengan grouping by member
    const commentProfilesMap = new Map();
    commentProfiles.forEach(profile => {
      commentProfilesMap.set(profile.username_sosmed, profile);
    });

    // Group comments by member ID to avoid duplicate entries for same user
    const groupedComments = {};
    commentRaw.forEach(item => {
      const profile = commentProfilesMap.get(item.username_sosmed);
      const member = profile?.members;
      const memberId = member?.id;
      
      if (memberId) {
        // If member already exists, sum the comments
        if (groupedComments[memberId]) {
          groupedComments[memberId].jumlah_komentar += item.jumlah_komentar;
          groupedComments[memberId].username_accounts.push(item.username_sosmed);
        } else {
          // Create new entry for this member
          const usernameObj = member?.user_usernames || null;
          groupedComments[memberId] = {
            ...item,
            peringkat: 0, // Will be recalculated
            member_id: memberId,
            jumlah_komentar: item.jumlah_komentar,
            username_accounts: [item.username_sosmed],
            foto_profil_url: member?.foto_profil_url || null,
            nama_lengkap: member?.nama_lengkap || item.nama_tampilan,
            username: usernameObj?.username || null,
            display_name: usernameObj?.display_name || null,
            // Show primary username or first one
            username_sosmed: item.username_sosmed
          };
        }
      } else {
        // If no member found, keep as individual entry (unclaimed accounts)
        groupedComments[`unclaimed_${item.username_sosmed}`] = {
          ...item,
          member_id: null,
          username_accounts: [item.username_sosmed],
          foto_profil_url: null,
          nama_lengkap: item.nama_tampilan,
          username: null,
          display_name: null,
        };
      }
    });

    // Convert to array and recalculate rankings
    let commentLeaderboard = Object.values(groupedComments);
    
    // Sort by jumlah_komentar descending
    commentLeaderboard.sort((a, b) => b.jumlah_komentar - a.jumlah_komentar);
    
    // Recalculate peringkat
    commentLeaderboard.forEach((item, index) => {
      item.peringkat = index + 1;
    });

    // Return simple response for backward compatibility
    return NextResponse.json({
      success: true,
      data: {
        loyaltyLeaderboard,
        commentLeaderboard,
        lastUpdate: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    
    // Return safe fallback data
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch leaderboard data',
      data: {
        loyaltyLeaderboard: [],
        commentLeaderboard: [],
        lastUpdate: new Date().toISOString()
      }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
