import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
export async function GET() {
  try {
    // Fetch semua user dengan total loyalty dan comment count
    const leaderboard = await prisma.members.findMany({
      select: {
        id: true,
        nama_lengkap: true,
        tanggal_daftar: true,
        google_id: true,
        foto_profil_url: true,
        loyalty_point: true, // Use field langsung dari members table
        // Get username dan display_name dari user_usernames
        user_usernames: {
          select: {
            username: true,
            display_name: true
          }
        }
      }
    });

    // Get comment count for each member
    const memberCommentCounts = await prisma.comments.groupBy({
      by: ['id_member'],
      _count: {
        id: true
      },
      where: {
        id_member: {
          not: null
        }
      }
    });

    // Create a map for quick lookup
    const commentCountMap = {};
    memberCommentCounts.forEach(item => {
      if (item.id_member) {
        commentCountMap[item.id_member] = item._count.id;
      }
    });

    // Process data untuk ranking
    const processedLeaderboard = leaderboard.map(member => {
      const totalLoyalty = member.loyalty_point || 0; // Use field langsung dari members
      const totalComments = commentCountMap[member.id] || 0;
      
      return {
        id: member.id,
        username: member.user_usernames?.username || `member_${member.id}`,
        display_name: member.user_usernames?.display_name || member.nama_lengkap || `Member ${member.id}`,
        nama_lengkap: member.nama_lengkap,
        total_loyalty: totalLoyalty,
        total_comments: totalComments,
        member_since: member.tanggal_daftar,
        google_id: member.clerk_id,
        foto_profil_url: member.foto_profil_url
      };
    });

    // Sort berdasarkan loyalty DESC
    processedLeaderboard.sort((a, b) => b.total_loyalty - a.total_loyalty);

    return NextResponse.json({
      success: true,
      data: processedLeaderboard,
      total_users: processedLeaderboard.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch leaderboard',
        message: error.message 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
