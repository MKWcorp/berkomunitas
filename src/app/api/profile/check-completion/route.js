import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/utils/prisma';

/**
 * GET /api/profile/check-completion
 * Check if user has completed their social media profile
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Find member and their social media profiles
    const member = await prisma.members.findUnique({
      where: { clerk_id: userId },
      include: {
        profil_sosial_media: true // Get all profiles, filter in JavaScript
      }
    });

    if (!member) {
      return NextResponse.json({ 
        success: true, 
        isComplete: false, 
        message: 'Member not found',
        member: null
      });
    }

    // Filter valid profiles using JavaScript (more reliable than Prisma where)
    const validProfiles = member.profil_sosial_media?.filter(profile => {
      const hasUsername = profile.username_sosmed && 
                         typeof profile.username_sosmed === 'string' && 
                         profile.username_sosmed.trim() !== '';
      const hasProfileLink = profile.profile_link && 
                            typeof profile.profile_link === 'string' && 
                            profile.profile_link.trim() !== '';
      
      return hasUsername && hasProfileLink;
    }) || [];

    const hasValidSocialMedia = validProfiles.length > 0;

    return NextResponse.json({
      success: true,
      isComplete: hasValidSocialMedia,
      member: {
        id: member.id,
        nama_lengkap: member.nama_lengkap,
        socialMediaCount: validProfiles.length
      },
      socialMediaProfiles: validProfiles,
      message: hasValidSocialMedia 
        ? 'Profile sudah lengkap' 
        : 'Mohon lengkapi data profil sosial media untuk dapat mengerjakan tugas'
    });

  } catch (error) {
    console.error('Error checking profile completion:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal Server Error' 
    }, { status: 500 });
  }
}
