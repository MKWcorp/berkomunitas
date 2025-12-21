import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';

/**
 * GET /api/debug/profile-data
 * Debug endpoint to check user's profile data
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find member and their social media profiles with detailed data
    const member = await prisma.members.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        nama_lengkap: true,
        google_id: true,
        profil_sosial_media: {
          select: {
            id: true,
            platform: true,
            username_sosmed: true,
            profile_link: true
          }
        }
      }
    });

    if (!member) {
      return NextResponse.json({ 
        error: 'Member not found',
        google_id: user.google_id
      });
    }

    // Debug logic validation
    const validProfiles = member.profil_sosial_media?.filter(profile => {
      const hasUsername = profile.username_sosmed && profile.username_sosmed.trim() !== '';
      const hasProfileLink = profile.profile_link && profile.profile_link.trim() !== '';
      
      return hasUsername && hasProfileLink;
    }) || [];

    const validationChecks = member.profil_sosial_media?.map(profile => ({
      id: profile.id,
      platform: profile.platform,
      username_sosmed: profile.username_sosmed,
      profile_link: profile.profile_link,
      checks: {
        username_not_null: profile.username_sosmed !== null,
        username_not_empty: profile.username_sosmed !== '',
        username_not_whitespace: profile.username_sosmed && profile.username_sosmed.trim() !== '',
        profile_link_not_null: profile.profile_link !== null,
        profile_link_not_empty: profile.profile_link !== '',
        profile_link_not_whitespace: profile.profile_link && profile.profile_link.trim() !== '',
        is_valid: (
          profile.username_sosmed && 
          profile.username_sosmed.trim() !== '' && 
          profile.profile_link && 
          profile.profile_link.trim() !== ''
        )
      }
    })) || [];

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        nama_lengkap: member.nama_lengkap,
        google_id: member.clerk_id
      },
      profil_sosial_media_raw: member.profil_sosial_media,
      validation_checks: validationChecks,
      valid_profiles: validProfiles,
      current_logic_result: {
        total_profiles: member.profil_sosial_media?.length || 0,
        valid_profiles_count: validProfiles.length,
        is_complete: validProfiles.length > 0
      },
      debug_info: {
        query_condition: "username_sosmed NOT NULL AND username_sosmed != '' AND profile_link NOT NULL AND profile_link != ''",
        expected_minimum: "1 valid social media profile"
      }
    });

  } catch (error) {
    console.error('Error in debug profile data:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
