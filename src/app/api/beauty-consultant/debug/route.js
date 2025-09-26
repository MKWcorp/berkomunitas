import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Debug endpoint untuk check dan fix verified data
export async function POST(request) {
  console.log('🛠️ [POST /api/beauty-consultant/debug] Starting debug request');
  
  try {
    const user = await currentUser();
    
    if (!user) {
      console.log('❌ [Debug] Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`📧 [Debug] User: ${user.emailAddresses[0]?.emailAddress} (${user.id})`);

    // Check member record
    const member = await prisma.members.findUnique({
      where: { clerk_id: user.id }
    });

    console.log('🔍 [Debug] Member found:', !!member);
    if (member) {
      console.log('🔍 [Debug] Member details:', {
        id: member.id,
        nama_lengkap: member.nama_lengkap,
        clerk_id: member.clerk_id
      });
    }

    // Check BC connection
    const bcConnection = await prisma.bc_drwskincare_plus.findFirst({
      where: {
        member: {
          clerk_id: user.id
        }
      },
      include: {
        bc_drwskincare_api: true
      }
    });

    console.log('🔍 [Debug] BC Connection found:', !!bcConnection);
    if (bcConnection) {
      console.log('🔍 [Debug] BC Connection details:', {
        id: bcConnection.id,
        member_id: bcConnection.member_id,
        reseller_id: bcConnection.reseller_id,
        verification_status: bcConnection.verification_status,
        api_data: !!bcConnection.bc_drwskincare_api
      });
    }

    // Check verified data
    const verifiedData = await prisma.bc_drwskincare_plus_verified.findFirst({
      where: {
        bc_drwskincare_plus: {
          member: {
            clerk_id: user.id
          }
        }
      }
    });

    console.log('🔍 [Debug] Verified data found:', !!verifiedData);
    if (verifiedData) {
      console.log('🔍 [Debug] Verified data details:', {
        id: verifiedData.id,
        connection_id: verifiedData.connection_id,
        nama: verifiedData.nama,
        area: verifiedData.area
      });
    }

    // If BC connection exists but no verified data, create it
    if (bcConnection && !verifiedData) {
      console.log('🔧 [Debug] BC connection exists but no verified data. Creating it...');
      
      try {
        const newVerifiedData = await prisma.bc_drwskincare_plus_verified.create({
          data: {
            api_data_id: bcConnection.bc_drwskincare_api?.id || bcConnection.reseller_id,
            connection_id: bcConnection.id,
            nama: bcConnection.bc_drwskincare_api?.nama_reseller || member?.nama_lengkap || 'Unknown',
            nomor_hp: bcConnection.bc_drwskincare_api?.nomor_hp,
            area: bcConnection.bc_drwskincare_api?.area,
            desa: null,
            kecamatan: null,
            kabupaten: null,
            propinsi: null,
            kode_pos: null,
            instagram_link: null,
            facebook_link: null,
            tiktok_link: null,
            created_at: new Date()
          }
        });
        
        console.log('✅ [Debug] Successfully created verified data:', newVerifiedData.id);
        
        return NextResponse.json({
          success: true,
          message: 'Verified data created successfully',
          data: {
            member: !!member,
            bc_connection: !!bcConnection,
            verified_data_created: true,
            verified_id: newVerifiedData.id
          }
        });
        
      } catch (createError) {
        console.error('💥 [Debug] Error creating verified data:', createError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create verified data',
          details: createError.message,
          data: {
            member: !!member,
            bc_connection: !!bcConnection,
            verified_data: !!verifiedData
          }
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Debug info retrieved',
      data: {
        member: !!member,
        bc_connection: !!bcConnection,
        verified_data: !!verifiedData,
        member_details: member ? {
          id: member.id,
          nama_lengkap: member.nama_lengkap
        } : null,
        connection_details: bcConnection ? {
          id: bcConnection.id,
          verification_status: bcConnection.verification_status,
          has_api_data: !!bcConnection.bc_drwskincare_api
        } : null,
        verified_details: verifiedData ? {
          id: verifiedData.id,
          nama: verifiedData.nama
        } : null
      }
    });

  } catch (error) {
    console.error('💥 [Debug] Error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error.message 
    }, { status: 500 });
  }
}