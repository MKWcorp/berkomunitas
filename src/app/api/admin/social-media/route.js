import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/social-media
 * Get all members with their social media profiles (including those without any)
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userPrivileges = await prisma.user_privileges.findFirst({
      where: { member_id: user.id,
        privilege: 'admin',
        is_active: true
      }
    });

    if (!userPrivileges) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get all members with their social media profiles
    const members = await prisma.members.findMany({
      include: {
        profil_sosial_media: {
          orderBy: { platform: 'asc' }
        },
        member_emails: {
          where: { is_primary: true },
          select: { email: true }
        }
      },
      orderBy: { nama_lengkap: 'asc' }
    });

    // Get unique platforms from database for filter options
    const platforms = await prisma.profil_sosial_media.findMany({
      select: {
        platform: true
      },
      distinct: ['platform'],      orderBy: {
        platform: 'asc'
      }
    });

    const platformList = platforms.map(p => p.platform);

    // Transform data to include member info and social media status
    const membersWithSocialMedia = members.map(member => ({
      id: member.id,
      nama_lengkap: member.nama_lengkap,
      foto_profil_url: member.foto_profil_url,
      email: member.member_emails[0]?.email || 'Tidak ada email',
      google_id: member.clerk_id,
      tanggal_daftar: member.tanggal_daftar,
      has_social_media: member.profil_sosial_media.length > 0,
      social_media_count: member.profil_sosial_media.length,
      profil_sosial_media: member.profil_sosial_media.map(profile => ({
        id: profile.id,
        platform: profile.platform,
        username_sosmed: profile.username_sosmed,
        profile_link: profile.profile_link
      }))
    }));

    // Transform data to flat array of social media profiles with member info
    const socialMediaProfiles = [];
    
    members.forEach(member => {
      if (member.profil_sosial_media.length > 0) {
        // Add each social media profile with member info
        member.profil_sosial_media.forEach(profile => {
          socialMediaProfiles.push({
            id: profile.id,
            platform: profile.platform,
            username: profile.username_sosmed,
            account_url: profile.profile_link,
            member: {
              id: member.id,
              nama_lengkap: member.nama_lengkap,
              foto_profil_url: member.foto_profil_url,
              email: member.member_emails[0]?.email || 'Tidak ada email',
              google_id: member.clerk_id
            }
          });
        });
      }
    });

    return NextResponse.json({ 
      success: true, 
      socialMedias: socialMediaProfiles,
      members: membersWithSocialMedia,
      platforms: platformList,
      total: socialMediaProfiles.length,
      totalMembers: membersWithSocialMedia.length,
      totalWithSocialMedia: membersWithSocialMedia.filter(m => m.has_social_media).length,
      totalWithoutSocialMedia: membersWithSocialMedia.filter(m => !m.has_social_media).length
    });

  } catch (error) {
    console.error('GET /api/admin/social-media error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/social-media
 * Create new social media profile
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userPrivileges = await prisma.user_privileges.findFirst({
      where: { member_id: user.id,
        privilege: 'admin',
        is_active: true
      }
    });

    if (!userPrivileges) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id_member, platform, username_sosmed, profile_link } = body;

    // Validate required fields
    if (!id_member || !platform || !username_sosmed) {
      return NextResponse.json({ 
        error: 'Missing required fields: id_member, platform, username_sosmed' 
      }, { status: 400 });
    }

    // Check if member exists
    const memberExists = await prisma.members.findUnique({
      where: { id: parseInt(id_member) }
    });

    if (!memberExists) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check for duplicate (same member, platform, username combination)
    const existingProfile = await prisma.profil_sosial_media.findFirst({
      where: {
        id_member: parseInt(id_member),
        platform,
        username_sosmed
      }
    });

    if (existingProfile) {
      return NextResponse.json({ 
        error: 'Profil sosial media dengan kombinasi member, platform, dan username ini sudah ada' 
      }, { status: 409 });
    }

    // Create new social media profile
    const newProfile = await prisma.profil_sosial_media.create({
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
      socialMedia: newProfile,
      message: 'Profil sosial media berhasil ditambahkan'
    });

  } catch (error) {
    console.error('POST /api/admin/social-media error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}
