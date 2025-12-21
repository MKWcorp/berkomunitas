import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
export async function POST(request) {
  try {
    // Check if user is authenticated
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to post on profile walls.' },
        { status: 401 }
      );
    }    // Get the logged-in member's data
    const currentMember = await prisma.members.findFirst({
      where: {
        OR: [
          { email: user.email },
          { google_id: user.google_id },
          user.clerk_id ? { google_id: user.clerk_id } : { id: user.id }
        ].filter(Boolean)
      }
    });

    if (!currentMember) {
      return NextResponse.json(
        { error: 'Member profile not found. Please complete your profile setup.' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { profileOwnerId, message } = body;

    // Validate input
    if (!profileOwnerId || !message) {
      return NextResponse.json(
        { error: 'Profile owner ID and message are required' },
        { status: 400 }
      );
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    if (message.trim().length > 500) {
      return NextResponse.json(
        { error: 'Message cannot exceed 500 characters' },
        { status: 400 }
      );
    }

    // Verify that the profile owner exists
    const profileOwner = await prisma.members.findUnique({
      where: {
        id: parseInt(profileOwnerId)
      },
      include: {
        user_usernames: {
          select: {
            username: true
          }
        }
      }
    });

    if (!profileOwner) {
      return NextResponse.json(
        { error: 'Profile owner not found' },
        { status: 404 }
      );
    }

    // Create the wall post
    const newWallPost = await prisma.profile_wall_posts.create({
      data: {
        profile_owner_id: parseInt(profileOwnerId),
        author_id: currentMember.id,
        message: message.trim()
      },
      include: {
        members_profile_wall_posts_author_idTomembers: {
          select: {
            id: true,
            nama_lengkap: true,
            foto_profil_url: true
          }
        }
      }
    });

    // Create notification for profile owner (if not posting on own profile)
    if (parseInt(profileOwnerId) !== currentMember.id) {
      try {
        await prisma.notifications.create({
          data: {
            id_member: parseInt(profileOwnerId),
            message: `${currentMember.nama_lengkap || 'Seseorang'} menulis di wall profil Anda: "${message.length > 50 ? message.substring(0, 50) + '...' : message}"`,
            link_url: `/profil/${profileOwner.user_usernames?.username || profileOwnerId}`,
            is_read: false
          }
        });
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // Don't fail the entire request if notification fails
      }
    }

    // Structure the response
    const responseData = {
      id: newWallPost.id,
      message: newWallPost.message,
      created_at: newWallPost.created_at,
      author: {
        id: newWallPost.members_profile_wall_posts_author_idTomembers.id,
        nama_lengkap: newWallPost.members_profile_wall_posts_author_idTomembers.nama_lengkap,
        foto_profil_url: newWallPost.members_profile_wall_posts_author_idTomembers.foto_profil_url
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Wall post created successfully',
      data: responseData
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating wall post:', error);
    return NextResponse.json(
      { error: 'Failed to create wall post' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
