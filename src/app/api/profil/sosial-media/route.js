import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profil/sosial-media
 * Get user's social media profiles
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find member by email or google_id
    const member = await prisma.members.findFirst({
      where: {
        OR: [
          { email: user.email },
          { google_id: user.google_id }
        ]
      }
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Get social media profiles for this member
    const socialProfiles = await prisma.profil_sosial_media.findMany({
      where: { id_member: member.id },
      orderBy: { id: 'asc' }
    });

    return NextResponse.json({ 
      success: true, 
      profiles: socialProfiles 
    });

  } catch (error) {
    console.error('Error fetching social media profiles:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

/**
 * POST /api/profil/sosial-media
 * Add new social media profile
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, platform, username } = await request.json();

    if (!url || !platform || !username) {
      return NextResponse.json(
        { error: 'URL, platform, and username are required' }, 
        { status: 400 }
      );
    }

    // Find member by email or google_id
    const member = await prisma.members.findFirst({
      where: {
        OR: [
          { email: user.email },
          { google_id: user.google_id }
        ]
      }
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check if username already exists on this platform (by any user)
    const existingProfile = await prisma.profil_sosial_media.findFirst({
      where: {
        platform: platform.toLowerCase(),
        username_sosmed: username
      },
      include: {
        members: {
          include: {
            user_usernames: true
          }
        }
      }
    });

    if (existingProfile) {
      const ownerName = existingProfile.members.user_usernames?.display_name || 
                       existingProfile.members.user_usernames?.username || 
                       existingProfile.members.nama_lengkap || 
                       'User lain';
      return NextResponse.json(
        { 
          error: `Username @${username} di platform ${platform} sudah digunakan oleh ${ownerName}. Pilih username yang berbeda.` 
        }, 
        { status: 409 } // Conflict status
      );
    }

    // Create new social media profile (allow multiple accounts per platform)
    const socialProfile = await prisma.profil_sosial_media.create({
      data: {
        id_member: member.id,
        platform: platform.toLowerCase(),
        profile_link: url,
        username_sosmed: username
      }
    });

    return NextResponse.json({ 
      success: true, 
      profile: socialProfile 
    });

  } catch (error) {
    console.error('Error creating social media profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profil/sosial-media
 * Delete social media profile
 */
export async function DELETE(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Profile ID is required' }, 
        { status: 400 }
      );
    }

    // Find member by email or google_id
    const member = await prisma.members.findFirst({
      where: {
        OR: [
          { email: user.email },
          { google_id: user.google_id }
        ]
      }
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Verify ownership and delete
    const deleted = await prisma.profil_sosial_media.deleteMany({
      where: { 
        id: id,
        id_member: member.id 
      }
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Profile not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting social media profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
