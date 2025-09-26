import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

export async function GET(_request) {
  try {
    // Public API - No authentication required for DRW Corp dashboard

    // Get ALL members sorted by loyalty points (descending)
    const allMembers = await prisma.members.findMany({
      include: {
        profil_sosial_media: {
          select: {
            username_sosmed: true,
            platform: true
          }
        },
        member_badges: {
          include: {
            badges: {
              select: {
                badge_name: true
              }
            }
          }
        },
        user_usernames: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        loyalty_point: 'desc'
      }
    });

    // Get comment counts for all members in a single query
    // Filter out undefined member IDs to avoid Prisma validation error
    const memberIds = allMembers.map(m => m.id).filter(id => id !== undefined && id !== null);
    
    // Only proceed with comment count query if we have valid member IDs
    const commentCounts = memberIds.length > 0 ? await prisma.comments.groupBy({
      by: ['id_member'],
      where: {
        id_member: {
          in: memberIds
        }
      },
      _count: {
        id: true
      }
    }) : [];

    // Create a map for quick lookup
    const commentCountMap = commentCounts.reduce((acc, item) => {
      acc[item.id_member] = item._count.id;
      return acc;
    }, {});

    // Format the response data
    const formattedMembers = allMembers.map((member) => {
      const socialProfiles = member.profil_sosial_media || [];
      
      // Get the first social media username or use user_usernames, or fallback to member ID
      const primarySocialMedia = socialProfiles.length > 0 
        ? socialProfiles[0].username_sosmed 
        : member.user_usernames?.[0]?.username || `member_${member.id}`;

      // Check if member has DRW Corp badge
      const hasDrwCorpBadge = member.member_badges.some(
        mb => mb.badges.badge_name === 'DRW Corp'
      );

      // Get all badge names
      const badges = member.member_badges.map(mb => mb.badges.badge_name);

      // Get comment count for this member
      const jumlah_komentar = commentCountMap[member.id] || 0;

      return {
        id: member.id,
        nama_lengkap: member.nama_lengkap || 'Nama tidak tersedia',
        username_sosmed: primarySocialMedia,
        username: member.user_usernames?.[0]?.username || null,
        loyalty_point: member.loyalty_point || 0,
        jumlah_komentar: jumlah_komentar,
        social_platforms: socialProfiles.map(p => p.platform).join(', ') || 'Tidak ada',
        tier: getTierFromLoyaltyPoints(member.loyalty_point || 0),
        badges: badges,
        hasDrwCorpBadge: hasDrwCorpBadge,
        created_at: member.created_at
      };
    });

    // Helper function to determine tier based on loyalty points
    function getTierFromLoyaltyPoints(points) {
      if (points >= 5000) return 'mighty';
      if (points >= 2000) return 'guard';
      if (points >= 1000) return 'servant';
      if (points >= 500) return 'commoners';
      if (points >= 200) return 'freepy';
      if (points >= 50) return 'lowly';
      return 'former';
    }

    // Get DRW Corp badge info for reference
    const drwCorpBadge = await prisma.badges.findFirst({
      where: { badge_name: 'DRW Corp' }
    });

    const drwCorpHolders = formattedMembers.filter(m => m.hasDrwCorpBadge);

    return NextResponse.json({
      success: true,
      data: formattedMembers,
      stats: {
        total_members: formattedMembers.length,
        drw_corp_holders: drwCorpHolders.length,
        regular_members: formattedMembers.length - drwCorpHolders.length
      },
      badge_info: drwCorpBadge ? {
        badge_name: drwCorpBadge.badge_name,
        description: drwCorpBadge.description,
        total_holders: drwCorpHolders.length
      } : null
    });

  } catch (____error) {
    console.error('GET /api/custom-dashboard/drwcorp error:', ____error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
