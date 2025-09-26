import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/beauty-consultant/preview - Preview BC data untuk konfirmasi
export async function POST(request) {
  try {
    const { reseller_id_input, input_phone } = await request.json();

    console.log('Preview API received:', { reseller_id_input, input_phone });

    if (!reseller_id_input || !input_phone) {
      return NextResponse.json({
        success: false,
        message: 'ID Reseller dan nomor telepon diperlukan'
      }, { status: 400 });
    }

    // Normalisasi nomor telepon
    const normalizePhone = (phone) => {
      if (!phone) return '';
      return phone.replace(/[\s\-\(\)]/g, '').replace(/^\+?62/, '0');
    };

    const normalizedInputPhone = normalizePhone(input_phone);
    console.log('Normalized input phone:', normalizedInputPhone);

    // Normalize input reseller_id (hilangkan semua non-digit)
    const normalizedResellerId = reseller_id_input.replace(/[^0-9]/g, '');
    console.log('Searching for reseller_id:', reseller_id_input);
    console.log('Normalized to:', normalizedResellerId);

    // Cari BC menggunakan PostgreSQL REGEXP_REPLACE untuk normalize database field saat pencarian
    // Ini akan mencocokkan terlepas dari format strip/dash
    const bcMatches = await prisma.$queryRaw`
      SELECT 
        "resellerId",
        "nama_reseller", 
        "nomor_hp",
        "whatsapp_number",
        "area",
        "level"
      FROM "bc_drwskincare_api" 
      WHERE REGEXP_REPLACE("resellerId", '[^0-9]', '', 'g') = ${normalizedResellerId}
    `;

    console.log(`Found ${bcMatches.length} matches using normalized search`);
    console.log('Matches:', bcMatches.map(bc => ({
      resellerId: bc.resellerId,
      nama: bc.nama_reseller,
      normalized_id: bc.resellerId.replace(/[^0-9]/g, '')
    })));

    console.log(`Found ${bcMatches.length} potential matches:`, bcMatches.map(bc => ({
      resellerId: bc.resellerId,
      nama: bc.nama_reseller,
      nomor_hp: bc.nomor_hp
    })));

    if (bcMatches.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'ID Reseller tidak ditemukan'
      }, { status: 404 });
    }

    // Cari yang cocok dengan nomor telepon
    let matchedBC = null;
    
    console.log('Phone matching process:');
    for (const bc of bcMatches) {
      const normalizedBcPhone = normalizePhone(bc.nomor_hp);
      const normalizedBcWhatsApp = normalizePhone(bc.whatsapp_number);
      
      console.log(`Checking BC ${bc.resellerId}:`, {
        original_nomor_hp: bc.nomor_hp,
        normalized_nomor_hp: normalizedBcPhone,
        original_whatsapp: bc.whatsapp_number,
        normalized_whatsapp: normalizedBcWhatsApp,
        input_phone_normalized: normalizedInputPhone,
        phone_match: normalizedInputPhone === normalizedBcPhone,
        whatsapp_match: normalizedInputPhone === normalizedBcWhatsApp
      });
      
      if (normalizedInputPhone === normalizedBcPhone || normalizedInputPhone === normalizedBcWhatsApp) {
        matchedBC = bc;
        console.log('✓ Phone match found!', bc.resellerId);
        break;
      }
    }

    if (!matchedBC) {
      console.log('❌ No phone match found');
      return NextResponse.json({
        success: false,
        message: 'Nomor telepon tidak cocok dengan data Beauty Consultant'
      }, { status: 404 });
    }

    // Buat preview data dengan masking
    const nama_preview = matchedBC.nama_reseller.length > 3 
      ? matchedBC.nama_reseller.substring(0, 3) + '****'
      : matchedBC.nama_reseller;

    return NextResponse.json({
      success: true,
      data: {
        resellerId: matchedBC.resellerId,
        nama_preview: nama_preview,
        area: matchedBC.area,
        level: matchedBC.level
      }
    });

  } catch (error) {
    console.error('Error in preview endpoint:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}