import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Retrieve verified data for current user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find member by Clerk user ID
    const member = await prisma.users.findFirst({
      where: { clerk_user_id: userId }
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check if user has BerkomunitasPlus privilege
    const hasPrivilege = await prisma.user_privileges.findFirst({
      where: {
        user_id: member.id,
        privilege: 'berkomunitasplus'
      }
    });

    if (!hasPrivilege) {
      return NextResponse.json({ error: 'BerkomunitasPlus privilege required' }, { status: 403 });
    }

    // Find the connection record in bc_drwskincare_plus
    const connection = await prisma.bc_drwskincare_plus.findFirst({
      where: { user_id: member.id }
    });

    if (!connection) {
      return NextResponse.json({ error: 'No BerkomunitasPlus connection found' }, { status: 404 });
    }

    // Get verified data using connection_id
    const verifiedData = await prisma.bc_drwskincare_plus_verified.findFirst({
      where: { connection_id: connection.id },
      include: {
        bc_drwskincare_api: true, // Include related API data
        bc_drwskincare_plus: true // Include connection data
      }
    });

    if (!verifiedData) {
      return NextResponse.json({ error: 'No verified data found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      verifiedData,
      connectionInfo: verifiedData.bc_drwskincare_plus,
      apiData: verifiedData.bc_drwskincare_api
    });

  } catch (error) {
    console.error('Error fetching verified data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create or update verified data
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      nama_lengkap,
      nomor_hp,
      alamat_lengkap,
      instagram_username,
      facebook_username,
      tiktok_username,
      youtube_username
    } = body;

    // Find member by Clerk user ID
    const member = await prisma.users.findFirst({
      where: { clerk_user_id: userId }
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check if user has BerkomunitasPlus privilege
    const hasPrivilege = await prisma.user_privileges.findFirst({
      where: {
        user_id: member.id,
        privilege: 'berkomunitasplus'
      }
    });

    if (!hasPrivilege) {
      return NextResponse.json({ error: 'BerkomunitasPlus privilege required' }, { status: 403 });
    }

    // Find the connection record in bc_drwskincare_plus
    const connection = await prisma.bc_drwskincare_plus.findFirst({
      where: { user_id: member.id }
    });

    if (!connection) {
      return NextResponse.json({ error: 'No BerkomunitasPlus connection found' }, { status: 404 });
    }

    // Get related API data if exists (optional connection)
    let apiDataId = null;
    if (connection.bc_api_id) {
      const apiData = await prisma.bc_drwskincare_api.findFirst({
        where: { id: connection.bc_api_id }
      });
      if (apiData) {
        apiDataId = apiData.id; // This will be TEXT type
      }
    }

    // Validate required fields
    if (!nama_lengkap) {
      return NextResponse.json({ error: 'Nama lengkap harus diisi' }, { status: 400 });
    }

    // Create or update verified data using connection_id
    const verifiedData = await prisma.bc_drwskincare_plus_verified.upsert({
      where: { connection_id: connection.id },
      update: {
        nama_lengkap,
        nomor_hp: nomor_hp || null,
        alamat_lengkap: alamat_lengkap || null,
        instagram_username: instagram_username || null,
        facebook_username: facebook_username || null,
        tiktok_username: tiktok_username || null,
        youtube_username: youtube_username || null,
        api_data_id: apiDataId,
        updated_at: new Date()
      },
      create: {
        connection_id: connection.id,
        api_data_id: apiDataId,
        nama_lengkap,
        nomor_hp: nomor_hp || null,
        alamat_lengkap: alamat_lengkap || null,
        instagram_username: instagram_username || null,
        facebook_username: facebook_username || null,
        tiktok_username: tiktok_username || null,
        youtube_username: youtube_username || null,
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        bc_drwskincare_api: true,
        bc_drwskincare_plus: true
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Data berhasil disimpan',
      verifiedData,
      connectionInfo: verifiedData.bc_drwskincare_plus,
      apiData: verifiedData.bc_drwskincare_api
    });

  } catch (error) {
    console.error('Error saving verified data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}