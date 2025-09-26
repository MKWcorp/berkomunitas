import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '../../../../utils/prisma';

// POST - User connect dengan Beauty Consultant account
export async function POST(request) {
  console.log('🔥 CONNECT ENDPOINT HIT');
  
  try {
    const { userId } = await auth();
    
    if (!userId) {
      console.log('❌ No userId found');
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get member data
    console.log('🔍 Looking for member with userId:', userId);
    const member = await prisma.members.findUnique({
      where: { clerk_id: userId },
      select: { id: true, nama_lengkap: true }
    });

    if (!member) {
      console.log('❌ Member not found for userId:', userId);
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    console.log('✅ Member found:', member.id);

    const body = await request.json();
    const { resellerId, input_phone } = body;
    console.log('📥 Connect request data:', { resellerId, input_phone });

    // Validasi input
    if (!resellerId || !input_phone) {
      console.log('❌ Missing required fields:', { resellerId: !!resellerId, input_phone: !!input_phone });
      return NextResponse.json(
        { error: 'Beauty Consultant ID and phone number are required' },
        { status: 400 }
      );
    }

    // Cek apakah member sudah connect ke BC lain - with timeout handling
    let existingConnection;
    try {
      existingConnection = await Promise.race([
        prisma.bc_drwskincare_plus.findFirst({
          where: { member_id: member.id },
          select: { id: true }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 5000))
      ]);
    } catch (error) {
      if (error.message === 'Query timeout') {
        console.log('⚠️ Query timeout for existing connection check');
        return NextResponse.json(
          { error: 'Database timeout. Please try again.' },
          { status: 503 }
        );
      }
      throw error;
    }

    if (existingConnection) {
      console.log('❌ Member already connected to BC:', existingConnection.id);
      return NextResponse.json(
        { error: 'You are already connected to a Beauty Consultant account' },
        { status: 400 }
      );
    }

    // Ambil data BC dari API table - with timeout handling
    console.log('🔍 Looking for BC data with resellerId:', resellerId);
    let bcData;
    try {
      bcData = await Promise.race([
        prisma.bc_drwskincare_api.findUnique({
          where: { resellerId: resellerId }, // Keep as string, don't parse to int
          select: {
            id: true,
            resellerId: true,
            nama_reseller: true,
            nomor_hp: true,
            area: true,
            level: true
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 5000))
      ]);
    } catch (error) {
      if (error.message === 'Query timeout') {
        console.log('⚠️ Query timeout for BC data lookup');
        return NextResponse.json(
          { error: 'Database timeout. Please try again.' },
          { status: 503 }
        );
      }
      throw error;
    }

    if (!bcData) {
      console.log('❌ BC data not found for resellerId:', resellerId);
      return NextResponse.json(
        { error: 'Beauty Consultant not found' },
        { status: 404 }
      );
    }

    console.log('✅ BC data found:', bcData.nama_reseller);

    // Normalize nomor untuk perbandingan
    const normalizeBcPhone = (phone) => phone?.replace(/^(\+62|62|0)/, '').replace(/\D/g, '');
    const normalizeInputPhone = (phone) => phone?.replace(/^(\+62|62|0)/, '').replace(/\D/g, '');

    const bcPhoneNormalized = normalizeBcPhone(bcData.nomor_hp);
    const inputPhoneNormalized = normalizeInputPhone(input_phone);

    const phoneMatches = bcPhoneNormalized === inputPhoneNormalized;
    console.log('📱 Phone comparison:', {
      bcPhone: bcData.nomor_hp,
      bcPhoneNormalized,
      inputPhone: input_phone,
      inputPhoneNormalized,
      matches: phoneMatches
    });

    // Auto-verification logic
    const verificationStatus = phoneMatches ? 'verified' : 'pending';
    const verifiedAt = phoneMatches ? new Date() : null;

    // Create connection record
    console.log('🔄 Creating connection record...');
    const connection = await prisma.bc_drwskincare_plus.create({
      data: {
        member_id: member.id,
        reseller_id: bcData.resellerId,
        input_phone: input_phone,
        verification_status: verificationStatus,
        verified_at: verifiedAt
      }
    });

    console.log('✅ Connection created:', connection.id);

    // Jika auto-verified, update user privilege ke berkomunitasplus
    if (phoneMatches) {
      console.log('🔄 Auto-verification - updating privilege...');
      
      // Find existing privilege record
      const existingPrivilege = await prisma.user_privileges.findFirst({
        where: { 
          clerk_id: userId,
          is_active: true 
        }
      });

      if (existingPrivilege) {
        // Update existing privilege
        await prisma.user_privileges.update({
          where: { id: existingPrivilege.id },
          data: {
            privilege: 'berkomunitasplus'
          }
        });
        console.log('✅ Updated existing privilege record');
      } else {
        // Create new privilege
        await prisma.user_privileges.create({
          data: {
            clerk_id: userId,
            privilege: 'berkomunitasplus',
            granted_at: new Date(),
            is_active: true
          }
        });
        console.log('✅ Created new privilege record');
      }

      // Pindahkan data dari bc_drwskincare_api ke bc_drwskincare_plus_verified
      try {
        console.log('🔄 Creating verified data record in connect flow...');
        console.log('🔍 BC Data for verified record:', {
          resellerId: bcData.resellerId,
          nama_reseller: bcData.nama_reseller,
          nomor_hp: bcData.nomor_hp,
          area: bcData.area
        });
        console.log('🔍 Connection ID for verified record:', connection.id);
        
        try {
          // Try with api_data_id first
          const verifiedRecord = await prisma.bc_drwskincare_plus_verified.create({
            data: {
              api_data_id: bcData.id, // This should be bcData.id (String ID from bc_drwskincare_api)
              connection_id: connection.id,
              nama: bcData.nama_reseller || member.nama_lengkap,
              nomor_hp: bcData.nomor_hp,
              area: bcData.area || null,
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
          
          console.log(`✅ Successfully created verified data record ${verifiedRecord.id} for connection ${connection.id}`);
        } catch (apiDataError) {
          console.log('⚠️ Creating without api_data_id due to error:', apiDataError.message);
          
          // Fallback: Create without api_data_id
          const verifiedRecord = await prisma.bc_drwskincare_plus_verified.create({
            data: {
              connection_id: connection.id,
              nama: bcData.nama_reseller || member.nama_lengkap,
              nomor_hp: bcData.nomor_hp,
              area: bcData.area || null,
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
          
          console.log(`✅ Created verified data record ${verifiedRecord.id} (without api_data_id) for connection ${connection.id}`);
        }
        
      } catch (verifiedDataError) {
        console.error('💥 CRITICAL: Error creating verified data in connect flow:', verifiedDataError);
        console.error('💥 Error details:', verifiedDataError.message);
        console.error('💥 Error stack:', verifiedDataError.stack);
        // Don't fail the entire operation if verified data creation fails, but log it prominently
        console.log('⚠️  WARNING: Verified data creation failed in connect flow');
      }
    } // End of if (phoneMatches) block

    return NextResponse.json({
      success: true,
      message: phoneMatches 
        ? 'Successfully connected and verified! Welcome to BerkomunitasPlus!' 
        : 'Connection request submitted. Verification is pending.',
      data: {
        connection_id: connection.id,
        bc_name: bcData.nama_reseller,
        verification_status: verificationStatus,
        auto_verified: phoneMatches,
        privilege_updated: phoneMatches
      }
    });

  } catch (error) {
    console.error('POST /api/beauty-consultant/connect error:', error);
    
    // Handle specific Prisma connection pool errors
    if (error.message?.includes('connection pool') || error.message?.includes('timeout')) {
      console.error('🚨 Database connection pool issue:', error.message);
      return NextResponse.json(
        { error: 'Database is busy. Please try again in a moment.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to connect Beauty Consultant account' },
      { status: 500 }
    );
  } finally {
    // Ensure database connections are released
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.warn('Warning: Failed to disconnect Prisma client:', disconnectError.message);
    }
  }
}

// GET - Cek status connection member saat ini
export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get member data
    const member = await prisma.members.findUnique({
      where: { clerk_id: userId },
      select: { id: true }
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Get current connection dengan include API data untuk level
    const connection = await prisma.bc_drwskincare_plus.findFirst({
      where: { member_id: member.id },
      include: {
        bc_drwskincare_api: {
          select: {
            nama_reseller: true,
            nomor_hp: true,
            alamat: true,
            level: true  // Include level from API table
          }
        }
      }
    });

    if (!connection) {
      return NextResponse.json({
        success: true,
        hasConnection: false,
        data: null
      });
    }

    // Get verified data if exists
    const verifiedData = await prisma.bc_drwskincare_plus_verified.findFirst({
      where: { connection_id: connection.id }
    });

    return NextResponse.json({
      success: true,
      hasConnection: true,
      data: {
        connection_id: connection.id,
        bc_name: verifiedData?.nama_lengkap || connection.nama_bc, // Prioritas dari verified data
        bc_phone: verifiedData?.nomor_hp || connection.nomor_hp_bc, // Prioritas dari verified data
        bc_address: verifiedData?.area || connection.alamat_bc, // Alias untuk area
        bc_level: connection.bc_drwskincare_api?.level || 'N/A', // Level dari API table
        verification_status: connection.verification_status,
        verified_at: connection.verified_at,
        created_at: connection.created_at,
        has_verified_data: !!verifiedData,
        verified_data: verifiedData ? {
          nama_lengkap: verifiedData.nama_lengkap,
          nomor_hp: verifiedData.nomor_hp,
          area: verifiedData.area,
          instagram_username: verifiedData.instagram_username,
          facebook_username: verifiedData.facebook_username,
          tiktok_username: verifiedData.tiktok_username,
          youtube_username: verifiedData.youtube_username
        } : null
      }
    });

  } catch (error) {
    console.error('GET /api/beauty-consultant/connect error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get connection status' },
      { status: 500 }
    );
  }
}