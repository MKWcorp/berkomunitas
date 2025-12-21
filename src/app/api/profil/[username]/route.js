import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureMemberHasUsername } from '@/utils/generateUsername';

// Retry operation for database queries
async function retryOperation(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      if (error.code === 'UND_ERR_SOCKET' || error.message?.includes('other side closed')) {
        console.log(`Retry attempt ${i + 1} for database operation`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      throw error;
    }
  }
}

export async function GET(request, { params }) {
  try {
    const { username } = await params;
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username parameter is required' },
        { status: 400 }
      );
    }
    
    // Find member by username in user_usernames table (new system)
    let member = null;
    let actualUsername = username;
    
    // Try to find in new username system first
    const userUsername = await retryOperation(() => 
      prisma.user_usernames.findUnique({
        where: {
          username: username.toLowerCase()
        },
        include: {
          members: true
        }
      })
    );

    if (userUsername && userUsername.members) {
      member = userUsername.members;
      actualUsername = userUsername.username;
    } else {
      // Fallback: Find member by username in profil_sosial_media table (legacy)
      const socialProfile = await retryOperation(() =>
        prisma.profil_sosial_media.findFirst({
          where: {
            username_sosmed: username
          },
          include: {
            members: true
          }
        })
      );

      if (socialProfile && socialProfile.members) {
        member = socialProfile.members;
        actualUsername = socialProfile.username_sosmed;
      }
    }

    // If no member found, try to find by member ID (in case username is user_123 format)
    if (!member && username.startsWith('user_')) {
      const memberIdMatch = username.match(/user_(\d+)/);
      if (memberIdMatch) {
        const memberId = parseInt(memberIdMatch[1]);
        const foundMember = await prisma.members.findUnique({
          where: { id: memberId }
        });
        
        if (foundMember) {
          // Auto-generate username for this member
          try {
            const generatedUsername = await ensureMemberHasUsername(memberId);
            
            // If the generated username matches what was requested, use this member
            if (generatedUsername === username) {
              member = foundMember;
              actualUsername = generatedUsername;
              console.log(`Auto-generated username ${generatedUsername} for member ${memberId}`);
            }
          } catch (error) {
            console.error('Error auto-generating username:', error);
          }
        }
      }
    }

    if (!member) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    const memberId = member.id;

    // Get member's badges with badge details including customization
    const memberBadges = await prisma.member_badges.findMany({
      where: {
        id_member: memberId
      },
      include: {
        badges: {
          select: {
            id: true,
            badge_name: true,
            description: true,
            criteria_type: true,
            criteria_value: true,
            badge_color: true,    // Include customization fields
            badge_style: true,    // Include customization fields
            badge_message: true   // Include customization fields
          }
        }
      },
      orderBy: {
        earned_at: 'desc'
      }
    });

    // Get featured badge details if exists
    let featuredBadge = null;
    if (member.featured_badge_id) {
      featuredBadge = await prisma.badges.findUnique({
        where: {
          id: member.featured_badge_id
        },
        select: {
          id: true,
          badge_name: true,
          description: true,
          criteria_type: true,
          criteria_value: true,
          badge_color: true,    // Include customization fields
          badge_style: true,    // Include customization fields
          badge_message: true   // Include customization fields
        }
      });
    }

    // Get member's current level based on loyalty points
    const currentLevel = await prisma.levels.findFirst({
      where: {
        required_points: {
          lte: member.loyalty_point
        }
      },
      orderBy: {
        required_points: 'desc'
      }
    });

    // Get 10 most recent wall posts with author details
    const wallPosts = await prisma.profile_wall_posts.findMany({
      where: {
        profile_owner_id: memberId
      },
      include: {
        members_profile_wall_posts_author_idTomembers: {
          select: {
            id: true,
            nama_lengkap: true,
            foto_profil_url: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 10
    });    // Get username info (custom or fallback)
    const usernameInfo = await prisma.user_usernames.findUnique({
      where: { member_id: memberId }
    });    // Get comment count
    const commentCount = await prisma.comments.count({
      where: {
        id_member: memberId
      }
    });

    // Get completed task count
    const completedTaskCount = await prisma.task_submissions.count({
      where: {
        id_member: memberId,
        status_submission: 'selesai'
      }
    });// Structure the response
    const profileData = {
      id: member.id,
      nama_lengkap: member.nama_lengkap,
      bio: member.bio,
      status_kustom: member.status_kustom,
      loyalty_point: member.loyalty_point,
      foto_profil_url: member.foto_profil_url,
      username: actualUsername,
      display_name: member.nama_lengkap || null,
      is_custom_username: usernameInfo?.is_custom || false,
      
      // Statistics
      jumlah_komentar: commentCount,
      jumlah_tugas_selesai: completedTaskCount,
      
      // Current level
      currentLevel: currentLevel ? {
        level_number: currentLevel.level_number,
        level_name: currentLevel.level_name,
        required_points: currentLevel.required_points
      } : null,

      // Featured badge
      featuredBadge: featuredBadge ? {
        id: featuredBadge.id,
        badge_name: featuredBadge.badge_name,
        description: featuredBadge.description
      } : null,

      // All badges
      badges: memberBadges.map(mb => ({
        id: mb.badges.id,
        badge_name: mb.badges.badge_name,
        description: mb.badges.description,
        earned_at: mb.earned_at,
        is_featured: mb.badges.id === member.featured_badge_id,
        badge_color: mb.badges.badge_color,
        badge_style: mb.badges.badge_style,
        badge_message: mb.badges.badge_message
      })),

      // Wall posts
      wallPosts: wallPosts.map(post => ({
        id: post.id,
        message: post.message,
        created_at: post.created_at,
        author: {
          id: post.members_profile_wall_posts_author_idTomembers.id,
          nama_lengkap: post.members_profile_wall_posts_author_idTomembers.nama_lengkap,
          foto_profil_url: post.members_profile_wall_posts_author_idTomembers.foto_profil_url
        }
      }))
    };

    return NextResponse.json(profileData);

  } catch (error) {
    console.error('Error fetching public profile:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      username: params?.username || 'unknown'
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch profile data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
