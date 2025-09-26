import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/utils/prisma';

/**
 * PUT /api/admin/social-media/[id]
 * Update social media profile
 */
export async function PUT(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userPrivileges = await prisma.user_privileges.findFirst({
      where: { 
        clerk_id: userId,
        privilege: 'admin',
        is_active: true
      }
    });

    if (!userPrivileges) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const socialMediaId = parseInt(id);

    if (isNaN(socialMediaId)) {
      return NextResponse.json({ error: 'Invalid social media ID' }, { status: 400 });
    }

    const body = await request.json();
    const { id_member, platform, username_sosmed, profile_link } = body;

    // Validate required fields
    if (!id_member || !platform || !username_sosmed) {
      return NextResponse.json({ 
        error: 'Missing required fields: id_member, platform, username_sosmed' 
      }, { status: 400 });
    }

    // Check if social media profile exists
    const existingProfile = await prisma.profil_sosial_media.findUnique({
      where: { id: socialMediaId }
    });

    if (!existingProfile) {
      return NextResponse.json({ error: 'Social media profile not found' }, { status: 404 });
    }

    // Check if member exists
    const memberExists = await prisma.members.findUnique({
      where: { id: parseInt(id_member) }
    });

    if (!memberExists) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check for duplicate (excluding current record)
    const duplicateProfile = await prisma.profil_sosial_media.findFirst({
      where: {
        id: { not: socialMediaId },
        id_member: parseInt(id_member),
        platform,
        username_sosmed
      }
    });

    if (duplicateProfile) {
      return NextResponse.json({ 
        error: 'Profil sosial media dengan kombinasi member, platform, dan username ini sudah ada' 
      }, { status: 409 });
    }

    // Update social media profile
    const updatedProfile = await prisma.profil_sosial_media.update({
      where: { id: socialMediaId },
      data: {
        id_member: parseInt(id_member),
        platform,
        username_sosmed,
        profile_link: profile_link || null
      },
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

    return NextResponse.json({ 
      success: true, 
      socialMedia: updatedProfile,
      message: 'Profil sosial media berhasil diperbarui'
    });

  } catch (error) {
    console.error('PUT /api/admin/social-media/[id] error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/social-media/[id]
 * Delete social media profile
 */
export async function DELETE(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userPrivileges = await prisma.user_privileges.findFirst({
      where: { 
        clerk_id: userId,
        privilege: 'admin',
        is_active: true
      }
    });

    if (!userPrivileges) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const socialMediaId = parseInt(id);

    if (isNaN(socialMediaId)) {
      return NextResponse.json({ error: 'Invalid social media ID' }, { status: 400 });
    }

    // Check if social media profile exists
    const existingProfile = await prisma.profil_sosial_media.findUnique({
      where: { id: socialMediaId },
      include: {
        members: {
          select: {
            nama_lengkap: true
          }
        }
      }
    });

    if (!existingProfile) {
      return NextResponse.json({ error: 'Social media profile not found' }, { status: 404 });
    }

    // Delete social media profile
    await prisma.profil_sosial_media.delete({
      where: { id: socialMediaId }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Profil sosial media ${existingProfile.platform} milik ${existingProfile.members.nama_lengkap} berhasil dihapus`
    });

  } catch (error) {
    console.error('DELETE /api/admin/social-media/[id] error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}
