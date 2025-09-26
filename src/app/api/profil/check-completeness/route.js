import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '../../../../../lib/prisma';

/**
 * GET /api/profil/check-completeness
 * Check if the current user's profile is complete
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find member and social media profiles
    const member = await prisma.members.findUnique({
      where: { clerk_id: userId },
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
    const { clerk_id } = await request.json();
    
    if (!clerk_id) {
      return NextResponse.json(
        { error: 'clerk_id is required', isComplete: false },
        { status: 400 }
      );
    }

    const member = await prisma.members.findUnique({
      where: { clerk_id },
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
