import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch verified BC data for user
export async function GET(request) {
  console.log('🔍 [GET /api/beauty-consultant/verified] Starting request');
  
  try {
    const user = await currentUser();
    
    if (!user) {
      console.log('❌ [Verified GET] Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`📧 [Verified GET] User: ${user.emailAddresses[0]?.emailAddress}`);

    // Get verified BC data for this user
    const verifiedData = await prisma.bc_drwskincare_plus_verified.findFirst({
      where: {
        bc_drwskincare_plus: {
          member: {
            clerk_id: user.id
          }
        }
      },
      include: {
        bc_drwskincare_plus: {
          include: {
            member: true
          }
        },
        bc_drwskincare_api: {
          select: {
            nama_reseller: true,
            area: true,
            level: true
          }
        }
      }
    });

    if (!verifiedData) {
      console.log('❌ [Verified GET] No verified BC data found');
      return NextResponse.json({ error: 'No verified data found' }, { status: 404 });
    }

    console.log(`✅ [Verified GET] Found verified data:`, {
      id: verifiedData.id,
      nama: verifiedData.nama,
      area: verifiedData.area,
      desa: verifiedData.desa,
      kecamatan: verifiedData.kecamatan,
      kabupaten: verifiedData.kabupaten,
      propinsi: verifiedData.propinsi
    });

    return NextResponse.json({
      success: true,
      data: verifiedData
    });

  } catch (error) {
    console.error('💥 [Verified GET] Error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error.message 
    }, { status: 500 });
  }
}

// PUT: Update verified BC data
export async function PUT(request) {
  console.log('📝 [PUT /api/beauty-consultant/verified] Starting request');
  
  try {
    const user = await currentUser();
    
    if (!user) {
      console.log('❌ [Verified PUT] Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`📧 [Verified PUT] User: ${user.emailAddresses[0]?.emailAddress}`);

    const body = await request.json();
    console.log('📋 [Verified PUT] Request body:', body);
    console.log('🏠 [Verified PUT] Alamat lengkap received:', body.alamat_lengkap);

    // Get verified data for this user - with debug logging
    console.log('🔍 [Verified PUT] Looking for verified data with clerk_id:', user.id);
    
    const existingData = await prisma.bc_drwskincare_plus_verified.findFirst({
      where: {
        bc_drwskincare_plus: {
          member: {
            clerk_id: user.id
          }
        }
      }
    });

    console.log('🔍 [Verified PUT] Found verified data:', !!existingData);
    
    if (existingData) {
      console.log('🔍 [Verified PUT] Verified data details:', {
        id: existingData.id,
        connection_id: existingData.connection_id,
        nama: existingData.nama
      });
    } else {
      // Let's also check if there's a BC connection at all
      const bcConnection = await prisma.bc_drwskincare_plus.findFirst({
        where: {
          member: {
            clerk_id: user.id
          }
        }
      });
      
      console.log('🔍 [Verified PUT] BC Connection exists:', !!bcConnection);
      if (bcConnection) {
        console.log('🔍 [Verified PUT] BC Connection details:', {
          id: bcConnection.id,
          member_id: bcConnection.member_id,
          verification_status: bcConnection.verification_status
        });
      }
    }

    if (!existingData) {
      console.log('❌ [Verified PUT] No verified data found to update');
      return NextResponse.json({ error: 'No verified data found to update' }, { status: 404 });
    }

    // Update verified data
    const updateData = {};
    
    // Only update fields that are provided
    if (body.nama_lengkap !== undefined) updateData.nama = body.nama_lengkap;
    if (body.nomor_hp !== undefined) updateData.nomor_hp = body.nomor_hp;
    if (body.area !== undefined) updateData.area = body.area;
    if (body.desa !== undefined) updateData.desa = body.desa;
    if (body.kecamatan !== undefined) updateData.kecamatan = body.kecamatan;
    if (body.kabupaten !== undefined) updateData.kabupaten = body.kabupaten;
    if (body.propinsi !== undefined) updateData.propinsi = body.propinsi;
    if (body.kode_pos !== undefined) updateData.kode_pos = body.kode_pos;
    if (body.alamat_lengkap !== undefined) updateData.alamat_detail = body.alamat_lengkap;
    if (body.instagram_username !== undefined) updateData.instagram_link = body.instagram_username;
    if (body.facebook_username !== undefined) updateData.facebook_link = body.facebook_username;
    if (body.tiktok_username !== undefined) updateData.tiktok_link = body.tiktok_username;

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    console.log('🔄 [Verified PUT] Updating data:', updateData);
    console.log('🏠 [Verified PUT] alamat_detail value:', updateData.alamat_detail);

    const updatedData = await prisma.bc_drwskincare_plus_verified.update({
      where: {
        id: existingData.id
      },
      data: updateData,
      include: {
        bc_drwskincare_plus: {
          include: {
            member: true
          }
        },
        bc_drwskincare_api: {
          select: {
            nama_reseller: true,
            area: true,
            level: true
          }
        }
      }
    });

    console.log(`✅ [Verified PUT] Successfully updated verified data for user`);

    return NextResponse.json({
      success: true,
      message: 'Verified data updated successfully',
      data: updatedData
    });

  } catch (error) {
    console.error('💥 [Verified PUT] Error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error.message 
    }, { status: 500 });
  }
}