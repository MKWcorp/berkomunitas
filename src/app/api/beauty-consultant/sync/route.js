import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';

// DRW Skincare API Configuration
const DRW_API_URL = 'https://drwgroup.id/apis/reseller/get';
const DRW_BEARER_TOKEN = 'c5d46484b83e6d90d2c55bc7a0ec9782493a1fa2434b66ebed36c3e668f74e89';

// Admin-only endpoint untuk sync data Beauty Consultant dari DRW API
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Check if user is admin - TEMPORARILY DISABLED FOR TESTING
    console.log('🔧 TESTING MODE: Admin check bypassed for user:', userId);
    
    // TODO: Re-enable admin check for production
    // const userPrivilege = await prisma.user_privileges.findFirst({
    //   where: { 
    //     id: user.id,
    //     is_active: true,
    //     privilege: 'admin'
    //   }
    // });

    // if (!userPrivilege) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized - Admin access required' },
    //     { status: 403 }
    //   );
    // }

    console.log('🚀 Starting DRW API sync...');

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
        // Extract data dari API response (berdasarkan struktur real DRW API)
        const bcData = {
          id_reseller: reseller.id_reseller, // Primary key
          nama_reseller: reseller.nama_reseller,
          nomor_hp: reseller.nomor_hp,
          area: reseller.area,
          id_upline: reseller.id_upline,
          level: reseller.level,
          facebook: reseller.facebook,
          instagram: reseller.instagram,
          foto_reseller: reseller.foto_reseller,
          email_address: null, // Tidak ada di API DRW
          whatsapp_number: reseller.nomor_hp, // Anggap sama dengan nomor_hp
          apiData: reseller, // Raw data untuk backup
          last_api_sync_at: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Skip jika tidak ada ID
        if (!bcData.id_reseller) {
          console.warn('⚠️ Skipping reseller without ID:', reseller);
          continue;
        }

        // Upsert ke database
        await prisma.bc_drwskincare_api.upsert({
          where: { id_reseller: bcData.id_reseller },
          update: {
            nama_reseller: bcData.nama_reseller,
            nomor_hp: bcData.nomor_hp,
            area: bcData.area,
            id_upline: bcData.id_upline,
            level: bcData.level,
            facebook: bcData.facebook,
            instagram: bcData.instagram,
            foto_reseller: bcData.foto_reseller,
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
        id_reseller: true,
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
      message: 'DRW API sync completed successfully',
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