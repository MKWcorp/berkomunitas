import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';

// POST - Confirm connection and move data to verified table
export async function POST(request) {
  console.log('🔥 CONFIRM ENDPOINT HIT');
  
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get member data
    console.log('🔍 Looking for member with userId:', userId);
    const member = await prisma.members.findUnique({
      where: { id: user.id },
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
    const { level, reseller_id, input_phone } = body; // Tambahkan reseller_id dan input_phone
    console.log('📥 Received data:', { level, reseller_id, input_phone });

    // Get current pending connection
    console.log('🔍 Looking for connection for member:', member.id);
    let connection = await prisma.bc_drwskincare_plus.findUnique({
      where: { member_id: member.id },
      include: {
        bc_drwskincare_api: {
          select: {
            id: true, // Primary key for foreign key reference
            resellerId: true,
            nama_reseller: true,
            nomor_hp: true,
            whatsapp_number: true,
            level: true,
            alamat: true
          }
        }
      }
    });

    // If no connection exists, create one (this happens when user goes directly from preview to confirm)
    if (!connection && reseller_id && input_phone) {
      console.log('🔄 No connection found, creating one from preview data...');
      
      // Get BC data first
      const bcData = await prisma.bc_drwskincare_api.findUnique({
        where: { resellerId: reseller_id.toString() },
        select: {
          id: true, // Primary key for foreign key reference
          resellerId: true,
          nama_reseller: true,
          nomor_hp: true,
          whatsapp_number: true,
          level: true,
          alamat: true
        }
      });

      if (!bcData) {
        console.log('❌ BC data not found for reseller_id:', reseller_id);
        return NextResponse.json(
          { error: 'Beauty Consultant data not found' },
          { status: 404 }
        );
      }

      // Check if BC is already taken by another member
      const bcTaken = await prisma.bc_drwskincare_plus.findUnique({
        where: { reseller_id: reseller_id.toString() }
      });

      if (bcTaken) {
        console.log('⚠️ BC already taken by member:', bcTaken.member_id);
        return NextResponse.json(
          { error: 'This Beauty Consultant account is already connected to another member' },
          { status: 400 }
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

      // Auto-verify if phone matches
      const phoneMatches = normalizedInputPhone === normalizedBcPhone || normalizedInputPhone === normalizedBcWhatsApp;
      const verificationStatus = phoneMatches ? 'verified' : 'pending';
      const verifiedAt = phoneMatches ? new Date() : null;

      console.log('🔄 Creating connection with auto-verification:', { phoneMatches, verificationStatus });

      // Create connection
      connection = await prisma.bc_drwskincare_plus.create({
        data: {
          member_id: member.id,
          reseller_id: reseller_id.toString(),
          input_phone: input_phone,
          verification_status: verificationStatus,
          verified_at: verifiedAt
        },
        include: {
          bc_drwskincare_api: {
            select: {
              id: true, // Primary key for foreign key reference
              resellerId: true,
              nama_reseller: true,
              nomor_hp: true,
              whatsapp_number: true,
              level: true,
              alamat: true
            }
          }
        }
      });

      console.log('✅ Connection created:', connection.id);
    }

    if (!connection) {
      console.log('❌ No connection found and unable to create one for member:', member.id);
      return NextResponse.json(
        { error: 'No connection found. Please try the connection process again.' },
        { status: 404 }
      );
    }

    console.log('✅ Connection found:', connection.id);

    if (connection.verification_status === 'verified') {
      console.log('ℹ️ Connection already verified, proceeding to privilege and data migration...');
    } else {
      console.log('⚠️ Connection pending verification');
    }

    // Verify level matches
    const bcData = connection.bc_drwskincare_api;
    console.log('🔍 Verifying level - Expected:', bcData.level, 'Received:', level);
    
    if (level !== bcData.level) {
      console.log('❌ Level verification failed');
      return NextResponse.json(
        { error: 'Level verification failed. Please check your Beauty Consultant level.' },
        { status: 400 }
      );
    }

    console.log('✅ Level verification passed');

    // Update connection status to verified (if not already verified)
    let updatedConnection = connection;
    if (connection.verification_status !== 'verified') {
      console.log('🔄 Updating connection status to verified...');
      updatedConnection = await prisma.bc_drwskincare_plus.update({
        where: { id: connection.id },
        data: {
          verification_status: 'verified',
          verified_at: new Date()
        }
      });
      console.log('✅ Connection status updated to verified');
    } else {
      console.log('ℹ️ Connection already verified');
    }

    // Update user privilege to berkomunitasplus
    console.log('🔄 Updating user privilege...');
    
    // First find existing privilege record
    const existingPrivilege = await prisma.user_privileges.findFirst({
      where: { member_id: user.id,
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
        data: { google_id: user.google_id,
          privilege: 'berkomunitasplus',
          granted_at: new Date(),
          is_active: true
        }
      });
      console.log('✅ Created new privilege record');
    }

    console.log('✅ User privilege updated');

    // Use bcData (already defined) for verified record creation
    console.log('📋 BC data for verified record:', {
      id: bcData.id,
      resellerId: bcData.resellerId,
      nama_reseller: bcData.nama_reseller
    });

    // Move data from bc_drwskincare_api to bc_drwskincare_plus_verified
    try {
      console.log('🔄 Creating verified data record...');
      console.log('🔍 BC Data for verified record:', {
        id: bcData.id,
        nama_reseller: bcData.nama_reseller,
        nomor_hp: bcData.nomor_hp,
        area: bcData.area
      });
      console.log('🔍 Connection ID for verified record:', connection.id);
      
      // Check if verified record already exists
      const existingVerified = await prisma.bc_drwskincare_plus_verified.findUnique({
        where: { connection_id: connection.id }
      });

      if (!existingVerified) {
        console.log('🆕 Creating new verified data record...');
        
        try {
          // Try with api_data_id first
          const verifiedRecord = await prisma.bc_drwskincare_plus_verified.create({
            data: {
              api_data_id: bcData.id,
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
        console.log('📊 Verified record details:', {
          id: verifiedRecord.id,
          nama: verifiedRecord.nama,
          nomor_hp: verifiedRecord.nomor_hp,
          area: verifiedRecord.area
        });
      } else {
        console.log(`ℹ️  Verified data already exists for connection ${connection.id} (record ${existingVerified.id})`);
      }
      
    } catch (verifiedDataError) {
      console.error('💥 CRITICAL: Error creating verified data:', verifiedDataError);
      console.error('💥 Error details:', verifiedDataError.message);
      console.error('💥 Error stack:', verifiedDataError.stack);
      // Continue with response even if verified data creation fails, but log it prominently
      console.log('⚠️  WARNING: Verified data creation failed, but continuing with response');
    }

    console.log('🎉 Confirmation process completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Connection confirmed successfully! Welcome to BerkomunitasPlus!',
      data: {
        connection_id: updatedConnection.id,
        bc_name: bcData.nama_reseller,
        verification_status: 'verified',
        privilege_updated: true,
        verified_at: updatedConnection.verified_at
      }
    });

  } catch (error) {
    console.error('💥 POST /api/beauty-consultant/confirm error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to confirm connection',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}