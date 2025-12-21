import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
import { ensureMemberHasUsername } from '@/utils/generateUsername';

// GET - Get current user's username info
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
      if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const member = await prisma.members.findFirst({
      where: {
        OR: [
          { email: user.email },
          { google_id: user.google_id },
          ...(user.clerk_id ? [{ google_id: user.clerk_id }] : [])
        ]
      },
      include: {
        user_usernames: true
      }
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Auto-generate username if member doesn't have one
    if (!member.user_usernames) {
      try {
        const generatedUsername = await ensureMemberHasUsername(member.id);
        
        // Fetch updated member data
        const updatedMember = await prisma.members.findUnique({
          where: { id: member.id },
          include: {
            user_usernames: true
          }
        });
        
        return NextResponse.json({
          username: updatedMember.user_usernames?.username || generatedUsername,
          display_name: updatedMember.nama_lengkap || null,
          is_custom: false, // Auto-generated usernames are not custom
          has_username: true,
          auto_generated: true
        });
        
      } catch (error) {
        console.error('Error auto-generating username:', error);
        // Continue with null response if auto-generation fails
      }
    }

    return NextResponse.json({
      username: member.user_usernames?.username || null,
      display_name: member.nama_lengkap || null,
      is_custom: member.user_usernames?.is_custom || false,
      has_username: !!member.user_usernames
    });

  } catch (error) {
    console.error('Error getting username:', error);
    return NextResponse.json(
      { error: 'Failed to get username' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create or update username
export async function POST(request) {
  return handleUsernameUpdate(request);
}

// PUT - Create or update username (same as POST for compatibility)
export async function PUT(request) {
  return handleUsernameUpdate(request);
}

// Shared function for both POST and PUT methods
async function handleUsernameUpdate(request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username } = body;

    // Validate username
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Username validation rules
    const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username hanya boleh mengandung huruf, angka, underscore, dan dash. Minimal 3 karakter, maksimal 50 karakter.' },
        { status: 400 }
      );
    }

    // Reserved usernames
    const reservedUsernames = [
      'admin', 'api', 'www', 'mail', 'ftp', 'localhost', 'root', 'user',
      'profile', 'dashboard', 'settings', 'login', 'register', 'signup',
      'signin', 'logout', 'about', 'contact', 'help', 'support', 'blog',
      'news', 'terms', 'privacy', 'legal', 'app', 'apps', 'mobile'
    ];

    if (reservedUsernames.includes(username.toLowerCase())) {
      return NextResponse.json(
        { error: 'Username ini tidak dapat digunakan karena sudah direservasi sistem' },
        { status: 400 }
      );
    }    const member = await prisma.members.findFirst({
      where: {
        OR: [
          { email: user.email },
          { google_id: user.google_id },
          ...(user.clerk_id ? [{ google_id: user.clerk_id }] : [])
        ]
      },
      include: {
        user_usernames: true
      }
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check if username is already taken by someone else
    const existingUsername = await prisma.user_usernames.findUnique({
      where: { username: username.toLowerCase() }
    });

    if (existingUsername && existingUsername.member_id !== member.id) {
      return NextResponse.json(
        { error: 'Username sudah digunakan oleh pengguna lain' },
        { status: 409 }
      );
    }

    // Create or update username
    const usernameData = {
      username: username.toLowerCase(),
      display_name: member.nama_lengkap || null,
      is_custom: true
    };

    let result;
    if (member.user_usernames) {
      // Update existing
      result = await prisma.user_usernames.update({
        where: { member_id: member.id },
        data: usernameData
      });
    } else {
      // Create new
      result = await prisma.user_usernames.create({
        data: {
          ...usernameData,
          member_id: member.id
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Username berhasil diperbarui',
      data: {
        username: result.username,
        display_name: member.nama_lengkap,
        is_custom: result.is_custom
      }
    });

  } catch (error) {
    console.error('Error updating username:', error);
    return NextResponse.json(
      { error: 'Failed to update username' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Remove custom username (revert to auto-generated)
export async function DELETE(request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const member = await prisma.members.findFirst({
      where: {
        OR: [
          { email: user.email },
          { google_id: user.google_id },
          ...(user.clerk_id ? [{ google_id: user.clerk_id }] : [])
        ]
      }
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    await prisma.user_usernames.delete({
      where: { member_id: member.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Username custom berhasil dihapus'
    });

  } catch (error) {
    console.error('Error deleting username:', error);
    return NextResponse.json(
      { error: 'Failed to delete username' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
