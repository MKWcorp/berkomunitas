import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
// GET /api/rewards/access-test - Test BerkomunitasPlus rewards access
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const member_id = searchParams.get('member_id');

    if (!member_id) {
      return NextResponse.json({
        success: false,
        message: 'member_id is required'
      }, { status: 400 });
    }

    // Get member data
    const member = await prisma.members.findUnique({
      where: { id: parseInt(member_id) },
      select: {
        id: true,
        nama_lengkap: true,
        google_id: true,
        loyalty_point: true,
        coin: true
      }
    });

    if (!member) {
      return NextResponse.json({
        success: false,
        message: 'Member not found'
      }, { status: 404 });
    }

    // Check if member has berkomunitasplus privilege
    const berkomunitasPlusPrivilege = await prisma.user_privileges.findFirst({
      where: { google_id: member.clerk_id,
        privilege: 'berkomunitasplus',
        is_active: true
      }
    });

    if (!berkomunitasPlusPrivilege) {
      return NextResponse.json({
        success: false,
        message: 'Access denied: BerkomunitasPlus privilege required',
        access_level: 'standard',
        member: {
          id: member.id,
          name: member.nama_lengkap,
          loyalty_points: member.loyalty_point,
          coins: member.coin
        }
      }, { status: 403 });
    }

    // Get BC connection info
    const bcConnection = await prisma.bc_drwskincare_plus.findFirst({
      where: { member_id: parseInt(member_id) },
      include: {
        bc_drwskincare_api: {
          select: {
            nama_reseller: true,
            level: true,
            area: true
          }
        }
      }
    });

    // Simulate exclusive BerkomunitasPlus rewards
    const exclusiveRewards = [
      {
        id: 'bc_bonus_points',
        name: 'Beauty Consultant Bonus Points',
        description: 'Extra loyalty points for verified BC members',
        bonus_multiplier: '2x',
        points_available: 500
      },
      {
        id: 'premium_products_access',
        name: 'Premium Products Access',
        description: 'Early access to new DRW Skincare products',
        status: 'available',
        products_count: 12
      },
      {
        id: 'bc_community_events',
        name: 'BC Community Events',
        description: 'Exclusive events for Beauty Consultant members',
        next_event: '2025-10-15T10:00:00Z',
        location: 'Jakarta'
      },
      {
        id: 'enhanced_commissions',
        name: 'Enhanced Commission Structure',
        description: 'Higher commission rates for BC members',
        commission_boost: '+15%',
        bc_level: bcConnection?.bc_drwskincare_api?.level || 'N/A'
      }
    ];

    return NextResponse.json({
      success: true,
      message: 'BerkomunitasPlus access granted',
      access_level: 'berkomunitasplus',
      member: {
        id: member.id,
        name: member.nama_lengkap,
        loyalty_points: member.loyalty_point,
        coins: member.coin,
        google_id: member.clerk_id
      },
      privilege_info: {
        granted_at: berkomunitasPlusPrivilege.granted_at,
        granted_by: berkomunitasPlusPrivilege.granted_by,
        privilege_id: berkomunitasPlusPrivilege.id
      },
      bc_connection: bcConnection ? {
        bc_name: bcConnection.bc_drwskincare_api.nama_reseller,
        bc_level: bcConnection.bc_drwskincare_api.level,
        bc_area: bcConnection.bc_drwskincare_api.area,
        verification_status: bcConnection.verification_status,
        verified_at: bcConnection.verified_at
      } : null,
      exclusive_rewards: exclusiveRewards,
      system_status: {
        bc_integration: 'active',
        rewards_system: 'online',
        privilege_system: 'active'
      }
    });

  } catch (error) {
    console.error('Error checking rewards access:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}