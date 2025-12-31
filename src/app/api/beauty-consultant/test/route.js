import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// DRW Skincare API Configuration
const DRW_API_URL = 'https://drwgroup.id/apis/reseller/get';
const DRW_BEARER_TOKEN = 'c5d46484b83e6d90d2c55bc7a0ec9782493a1fa2434b66ebed36c3e668f74e89';

// Simple test endpoint untuk test DRW API tanpa auth
export async function GET(request) {
  try {
    console.log('🚀 Testing DRW API connection...');

    // Fetch data dari DRW API
    const response = await fetch(DRW_API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DRW_BEARER_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ DRW API Error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch data from DRW API', details: response.statusText, status: response.status },
        { status: response.status }
      );
    }

    const apiResult = await response.json();
    console.log('📡 DRW API Response status:', apiResult.status);
    console.log('📊 Total resellers from API:', apiResult.data?.length || 0);

    // Return sample dari response
    return NextResponse.json({
      success: true,
      message: 'DRW API test successful',
      drw_api_status: apiResult.status,
      total_resellers: apiResult.data?.length || 0,
      sample_reseller: apiResult.data?.[0] || null,
      response_structure: {
        has_status: 'status' in apiResult,
        has_data: 'data' in apiResult,
        data_is_array: Array.isArray(apiResult.data),
      }
    });

  } catch (error) {
    console.error('💥 Test Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during API test', 
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// POST endpoint untuk full sync ke database tanpa auth (testing only)
export async function POST(request) {
  try {
    console.log('🚀 Starting DRW API sync (NO AUTH - TESTING ONLY)...');

    // Fetch data dari DRW API
    const response = await fetch(DRW_API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DRW_BEARER_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ DRW API Error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch data from DRW API', details: response.statusText },
        { status: response.status }
      );
    }

    const apiResult = await response.json();
    console.log('📡 DRW API Response status:', apiResult.status);
    console.log('📊 Total resellers from API:', apiResult.data?.length || 0);

    if (!apiResult.data || !Array.isArray(apiResult.data)) {
      console.error('❌ Invalid API response structure:', apiResult);
      return NextResponse.json(
        { error: 'Invalid response format from DRW API' },
        { status: 500 }
      );
    }

    const resellers = apiResult.data;
    let processedCount = 0;
    let errorCount = 0;

    // Process each reseller
    for (const reseller of resellers) {
      try {
        // Extract data dari API response dan map ke schema database
        const bcData = {
          id: reseller.id_reseller, // Primary key
          resellerId: reseller.id_reseller,
          apiResellerId: reseller.id_reseller, // Backup field
          nama_reseller: reseller.nama_reseller,
          nomor_hp: reseller.nomor_hp,
          nomorHp: reseller.nomor_hp, // Duplicate field
          area: reseller.area,
          level: reseller.level,
          facebook: reseller.facebook,
          instagram: reseller.instagram,
          photo_url: reseller.foto_reseller,
          email_address: null, // Tidak ada di API DRW
          whatsapp_number: reseller.nomor_hp, // Anggap sama dengan nomor_hp
          apiData: reseller, // Raw data untuk backup
          last_api_sync_at: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          joinDate: new Date()
        };

        // Skip jika tidak ada ID
        if (!bcData.id) {
          console.warn('⚠️ Skipping reseller without ID:', reseller);
          continue;
        }

        // Upsert ke database
        await prisma.bc_drwskincare_api.upsert({
          where: { id: bcData.id },
          update: {
            resellerId: bcData.resellerId,
            apiResellerId: bcData.apiResellerId,
            nama_reseller: bcData.nama_reseller,
            nomor_hp: bcData.nomor_hp,
            nomorHp: bcData.nomorHp,
            area: bcData.area,
            level: bcData.level,
            facebook: bcData.facebook,
            instagram: bcData.instagram,
            photo_url: bcData.photo_url,
            email_address: bcData.email_address,
            whatsapp_number: bcData.whatsapp_number,
            apiData: bcData.apiData,
            last_api_sync_at: bcData.last_api_sync_at,
            updatedAt: bcData.updatedAt
          },
          create: bcData
        });

        processedCount++;
        
        if (processedCount % 50 === 0) {
          console.log(`📝 Processed ${processedCount} resellers...`);
        }

      } catch (error) {
        console.error('❌ Error processing reseller:', reseller.id_reseller, error.message);
        errorCount++;
      }
    }

    // Get summary statistics
    const totalCount = await prisma.bc_drwskincare_api.count();
    const recentCount = await prisma.bc_drwskincare_api.count({
      where: {
        last_api_sync_at: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      }
    });

    // Sample data (5 terbaru)
    const sampleData = await prisma.bc_drwskincare_api.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        resellerId: true,
        nama_reseller: true,
        nomor_hp: true,
        whatsapp_number: true,
        level: true,
        area: true,
        createdAt: true
      }
    });

    const result = {
      success: true,
      message: 'DRW API sync completed successfully (TEST MODE)',
      statistics: {
        total_from_api: resellers.length,
        processed_successfully: processedCount,
        errors: errorCount,
        total_in_database: totalCount,
        recently_synced: recentCount
      },
      sample_data: sampleData,
      sync_timestamp: new Date()
    };

    console.log('✅ Sync completed:', result.statistics);
    return NextResponse.json(result);

  } catch (error) {
    console.error('💥 Sync Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during sync', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// PUT endpoint untuk test connection flow tanpa auth
export async function PUT(request) {
  try {
    const body = await request.json();
    const { resellerId, input_phone, test_member_id = 1 } = body;

    console.log('🔧 Testing BC connection (NO AUTH):', { resellerId, input_phone, test_member_id });

    if (!resellerId || !input_phone) {
      return NextResponse.json(
        { error: 'resellerId and input_phone are required' },
        { status: 400 }
      );
    }

    // Check if BC exists - use findFirst as fallback
    const bcData = await prisma.bc_drwskincare_api.findFirst({
      where: { 
        OR: [
          { id: resellerId.toString() },
          { resellerId: resellerId.toString() }
        ]
      },
      select: {
        id: true,
        resellerId: true,
        nama_reseller: true,
        nomor_hp: true,
        whatsapp_number: true,
        level: true,
        area: true
      }
    });

    if (!bcData) {
      return NextResponse.json(
        { error: 'Beauty Consultant ID not found', resellerId },
        { status: 404 }
      );
    }

    // Normalisasi nomor telepon untuk matching
    const normalizePhone = (phone) => {
      if (!phone) return '';
      return phone.replace(/[\s\-\(\)]/g, '').replace(/^\+?62/, '0');
    };

    const normalizedInputPhone = normalizePhone(input_phone);
    const normalizedBcPhone = normalizePhone(bcData.nomor_hp);
    const normalizedBcWhatsApp = normalizePhone(bcData.whatsapp_number);

    // Phone verification
    const phoneMatches = normalizedInputPhone === normalizedBcPhone || normalizedInputPhone === normalizedBcWhatsApp;
    const verificationStatus = phoneMatches ? 'verified' : 'pending';

    // Check if already connected
    const existingConnection = await prisma.bc_drwskincare_plus.findUnique({
      where: { member_id: test_member_id }
    });

    if (existingConnection) {
      return NextResponse.json({
        success: false,
        message: 'Member already connected',
        existing_connection: {
          reseller_id: existingConnection.reseller_id,
          status: existingConnection.verification_status
        }
      });
    }

    // Create connection
    const connection = await prisma.bc_drwskincare_plus.create({
      data: {
        member_id: test_member_id,
        reseller_id: resellerId.toString(),
        input_phone: input_phone,
        verification_status: verificationStatus,
        verified_at: phoneMatches ? new Date() : null
      }
    });

    // Jika auto-verified, update user privilege ke berkomunitasplus
    let privilegeUpdated = false;
    if (phoneMatches) {
      // Get member's clerk_id for privilege update
      const member = await prisma.members.findUnique({
        where: { id: test_member_id },
        select: { google_id: true }
      });

      if (member?.clerk_id) {
        // Check if privilege already exists
        const existingPrivilege = await prisma.user_privileges.findFirst({
          where: { google_id: member.clerk_id,
            privilege: 'berkomunitasplus'
          }
        });

        if (existingPrivilege) {
          // Update existing privilege
          await prisma.user_privileges.update({
            where: { id: existingPrivilege.id },
            data: {
              is_active: true,
              granted_by: 'auto-bc-connection',
              granted_at: new Date()
            }
          });
        } else {
          // Create new privilege
          await prisma.user_privileges.create({
            data: {
              google_id: member.clerk_id,
              privilege: 'berkomunitasplus',
              granted_at: new Date(),
              granted_by: 'auto-bc-connection',
              is_active: true
            }
          });
        }
        
        privilegeUpdated = true;
      }
    }

    return NextResponse.json({
      success: true,
      message: phoneMatches 
        ? 'Successfully connected and verified! Welcome to BerkomunitasPlus!' 
        : 'Connection request submitted. Verification is pending.',
      data: {
        connection_id: connection.id,
        bc_name: bcData.nama_reseller,
        bc_phone: bcData.nomor_hp,
        bc_whatsapp: bcData.whatsapp_number,
        bc_level: bcData.level,
        bc_area: bcData.area,
        verification_status: verificationStatus,
        auto_verified: phoneMatches,
        privilege_updated: privilegeUpdated,
        phone_check: {
          input: normalizedInputPhone,
          bc_phone: normalizedBcPhone,
          bc_whatsapp: normalizedBcWhatsApp,
          matches: phoneMatches
        }
      }
    });

  } catch (error) {
    console.error('💥 Connection Test Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during connection test', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}