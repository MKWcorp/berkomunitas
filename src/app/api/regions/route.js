import { NextResponse } from 'next/server';

// API endpoint untuk data wilayah Indonesia
// Menggunakan API eksternal emsifa/api-wilayah-indonesia

const BASE_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api';

export async function GET(request) {
  console.log('🌏 [GET /api/regions] Starting Indonesian region request');
  
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // provinces, regencies, districts, villages
    const code = searchParams.get('code'); // parent code for child regions
    
    console.log(`📋 [Regions] Type: ${type}, Code: ${code}`);

    let url = '';
    
    switch (type) {
      case 'provinces':
        url = `${BASE_URL}/provinces.json`;
        break;
      case 'regencies':
        if (!code) {
          return NextResponse.json({ error: 'Province code required for regencies' }, { status: 400 });
        }
        url = `${BASE_URL}/regencies/${code}.json`;
        break;
      case 'districts':
        if (!code) {
          return NextResponse.json({ error: 'Regency code required for districts' }, { status: 400 });
        }
        url = `${BASE_URL}/districts/${code}.json`;
        break;
      case 'villages':
        if (!code) {
          return NextResponse.json({ error: 'District code required for villages' }, { status: 400 });
        }
        url = `${BASE_URL}/villages/${code}.json`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid type. Use: provinces, regencies, districts, or villages' }, { status: 400 });
    }

    console.log(`🔗 [Regions] Fetching from: ${url}`);

    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ [Regions] API error: ${response.status} ${response.statusText}`);
      return NextResponse.json({ 
        error: 'Failed to fetch region data',
        status: response.status 
      }, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ [Regions] Successfully fetched ${data.length} ${type}`);

    return NextResponse.json({
      success: true,
      type,
      code,
      data
    });

  } catch (error) {
    console.error('💥 [Regions] Error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error.message 
    }, { status: 500 });
  }
}

// Helper function untuk mencari region berdasarkan nama
export async function POST(request) {
  console.log('🔍 [POST /api/regions] Starting region search');
  
  try {
    const body = await request.json();
    const { query, type } = body;
    
    if (!query || !type) {
      return NextResponse.json({ error: 'Query and type are required' }, { status: 400 });
    }

    console.log(`🔎 [Regions Search] Query: "${query}", Type: ${type}`);

    // First get all data for the specified type
    let url = '';
    switch (type) {
      case 'provinces':
        url = `${BASE_URL}/provinces.json`;
        break;
      default:
        return NextResponse.json({ error: 'Search only supports provinces for now' }, { status: 400 });
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch region data',
        status: response.status 
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Filter by query (case insensitive)
    const filtered = data.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase())
    );

    console.log(`✅ [Regions Search] Found ${filtered.length} matches for "${query}"`);

    return NextResponse.json({
      success: true,
      query,
      type,
      results: filtered
    });

  } catch (error) {
    console.error('💥 [Regions Search] Error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error.message 
    }, { status: 500 });
  }
}