import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/user/privileges - Check user privileges
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

    // Get member data with privileges
    const member = await prisma.members.findUnique({
      where: { id: parseInt(member_id) },
      select: {
        id: true,
        nama_lengkap: true,
        clerk_id: true
      }
    });

    if (!member) {
      return NextResponse.json({
        success: false,
        message: 'Member not found'
      }, { status: 404 });
    }

    // Get user privileges
    const privileges = await prisma.user_privileges.findMany({
      where: {
        clerk_id: member.clerk_id,
        is_active: true
      },
      select: {
        id: true,
        privilege: true,
        granted_at: true,
        granted_by: true,
        expires_at: true,
        is_active: true
      },
      orderBy: { granted_at: 'desc' }
    });

    // Get BC connection status dengan data dari verified table
    const bcConnection = await prisma.bc_drwskincare_plus.findFirst({
      where: { member_id: parseInt(member_id) },
      include: {
        bc_drwskincare_api: {
          select: {
            nama_reseller: true,
            level: true,
            area: true,
            nomor_hp: true
          }
        }
      }
    });

    // Get verified BC data if exists
    let verifiedBcData = null;
    if (bcConnection) {
      verifiedBcData = await prisma.bc_drwskincare_plus_verified.findFirst({
        where: { connection_id: bcConnection.id }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        member: member,
        privileges: privileges,
        bc_connection: bcConnection ? {
          reseller_id: bcConnection.reseller_id,
          verification_status: bcConnection.verification_status,
          verified_at: bcConnection.verified_at,
          created_at: bcConnection.created_at,
          // Prioritas data dari verified table, fallback ke API table
          bc_name: verifiedBcData?.nama || bcConnection.bc_drwskincare_api?.nama_reseller,
          bc_phone: verifiedBcData?.nomor_hp || bcConnection.bc_drwskincare_api?.nomor_hp,
          bc_address: verifiedBcData?.area || bcConnection.bc_drwskincare_api?.area, // Area untuk alamat
          bc_level: bcConnection.bc_drwskincare_api?.level, // Level selalu dari API table
          // Address details dari verified table
          desa: verifiedBcData?.desa || null,
          kecamatan: verifiedBcData?.kecamatan || null,
          kabupaten: verifiedBcData?.kabupaten || null,
          propinsi: verifiedBcData?.propinsi || null,
          kode_pos: verifiedBcData?.kode_pos || null,
          // Social media dari verified table
          instagram_username: verifiedBcData?.instagram_link || null,
          facebook_username: verifiedBcData?.facebook_link || null,
          tiktok_username: verifiedBcData?.tiktok_link || null,
          youtube_username: null, // Tidak ada field ini di schema
          has_verified_data: !!verifiedBcData,
          bc_info: bcConnection.bc_drwskincare_api
        } : null,
        has_berkomunitasplus: privileges.some(p => p.privilege === 'berkomunitasplus'),
        privilege_count: privileges.length
      }
    });

  } catch (error) {
    console.error('Error checking user privileges:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

// POST /api/user/privileges - Grant privilege to user (admin function)
export async function POST(request) {
  try {
    const { member_id, privilege, granted_by } = await request.json();

    if (!member_id || !privilege) {
      return NextResponse.json({
        success: false,
        message: 'member_id and privilege are required'
      }, { status: 400 });
    }

    // Get member's clerk_id
    const member = await prisma.members.findUnique({
      where: { id: parseInt(member_id) },
      select: { clerk_id: true, nama_lengkap: true }
    });

    if (!member || !member.clerk_id) {
      return NextResponse.json({
        success: false,
        message: 'Member not found or no clerk_id'
      }, { status: 404 });
    }

    // Check if privilege already exists
    const existingPrivilege = await prisma.user_privileges.findFirst({
      where: {
        clerk_id: member.clerk_id,
        privilege: privilege
      }
    });

    if (existingPrivilege) {
      // Update existing privilege
      const updated = await prisma.user_privileges.update({
        where: { id: existingPrivilege.id },
        data: {
          is_active: true,
          granted_by: granted_by || 'manual-admin',
          granted_at: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Privilege updated successfully',
        data: updated
      });
    } else {
      // Create new privilege
      const newPrivilege = await prisma.user_privileges.create({
        data: {
          clerk_id: member.clerk_id,
          privilege: privilege,
          granted_at: new Date(),
          granted_by: granted_by || 'manual-admin',
          is_active: true
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Privilege granted successfully',
        data: newPrivilege
      });
    }

  } catch (error) {
    console.error('Error granting privilege:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}