import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '../../../../../../lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/profil/sosial-media/check-availability
 * Check if username is available on specific platform
 */
export async function POST(request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform, username } = await request.json();

    if (!platform || !username) {
      return NextResponse.json(
        { error: 'Platform and username are required' }, 
        { status: 400 }
      );
    }

    // Check if username already exists on this platform
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
      // If it's the current user's own account, it's available for edit
      if (existingProfile.members.clerk_id === user.id) {
        return NextResponse.json({
          available: true,
          message: 'Ini adalah akun Anda sendiri',
          isOwnAccount: true
        });
      }

      // Username taken by someone else
      const ownerName = existingProfile.members.user_usernames?.display_name || 
                       existingProfile.members.user_usernames?.username || 
                       existingProfile.members.nama_lengkap || 
                       'User lain';
      return NextResponse.json({
        available: false,
        message: `Username @${username} sudah digunakan oleh ${ownerName}`,
        takenBy: ownerName
      });
    }

    // Username is available
    return NextResponse.json({
      available: true,
      message: `Username @${username} tersedia`
    });

  } catch (error) {
    console.error('Error checking username availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
