import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';

/**
 * GET /api/profil/check-completeness
 * Check if the current user's profile is complete
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }    // Find member by email, google_id, or clerk_id
    const member = await prisma.members.findFirst({
      where: {
        OR: [
          { email: user.email },
          { google_id: user.google_id },
          user.clerk_id ? { google_id: user.clerk_id } : { id: user.id }
        ].filter(Boolean)
      },
      include: {
        profil_sosial_media: true
      }
    });

    if (!member) {
      return NextResponse.json({ 
        isComplete: false,
        missing: ['member_record', 'nama_lengkap', 'nomer_wa', 'social_media']
      });
    }

    // Check completeness
    const missing = [];
    if (!member.nama_lengkap) missing.push('nama_lengkap');
    if (!member.nomer_wa) missing.push('nomer_wa');
    if (!member.profil_sosial_media || member.profil_sosial_media.length === 0) {
      missing.push('social_media');
    }

    const isComplete = missing.length === 0;

    return NextResponse.json({
      isComplete,
      missing,
      member: {
        nama_lengkap: member.nama_lengkap,
        nomer_wa: member.nomer_wa,
        social_media_count: member.profil_sosial_media.length
      }
    });

  } catch (error) {
    console.error('Error checking profile completeness:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      isComplete: false 
    }, { status: 500 });
  }
}

/**
 * POST /api/profil/check-completeness
 * Check if a specific user's profile is complete (for middleware use)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { clerk_id, email, google_id } = body;
    
    if (!clerk_id && !email && !google_id) {
      return NextResponse.json(
        { error: 'clerk_id, email, or google_id is required', isComplete: false },
        { status: 400 }
      );
    }

    const member = await prisma.members.findFirst({
      where: {
        OR: [
          clerk_id ? { clerk_id } : {},
          email ? { email } : {},
          google_id ? { google_id } : {}
        ].filter(obj => Object.keys(obj).length > 0)
      },
      include: {
        profil_sosial_media: true
      }
    });

    if (!member) {
      return NextResponse.json({
        isComplete: false,
        missingFields: ['profile_not_created']
      });
    }

    const missingFields = [];
    
    // Check required fields
    if (!member.nama_lengkap) missingFields.push('nama_lengkap');
    if (!member.nomer_wa) missingFields.push('nomer_wa');
    if (!member.profil_sosial_media || member.profil_sosial_media.length === 0) {
      missingFields.push('profil_sosial_media');
    }

    return NextResponse.json({
      isComplete: missingFields.length === 0,
      missingFields
    });
  } catch (error) {
    console.error('Error checking profile completeness (POST):', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        isComplete: false,
        missingFields: ['database_error'] 
      },
      { status: 500 }
    );
  }
}
