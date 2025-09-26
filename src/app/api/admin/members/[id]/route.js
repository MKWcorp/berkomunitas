import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { requireAdmin } from '../../../../../../lib/requireAdmin';

export async function GET(req, { params }) {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: paramId } = await params;
  const id = Number(paramId);
  if (!id) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });

  try {
    const member = await prisma.members.findUnique({
      where: { id },
      select: {
        id: true,
        nama_lengkap: true,
        nomer_wa: true,
        loyalty_point: true,
        bio: true,
        status_kustom: true,
        foto_profil_url: true,
        tanggal_daftar: true,
        clerk_id: true,
        user_usernames: { select: { username: true } },
        member_emails: {
          select: { email: true },
          where: { is_primary: true },
          take: 1,
        },
        profil_sosial_media: {
          select: {
            platform: true,
            username_sosmed: true,
          },
          take: 1,
        },
      },
    });

    if (!member) {
      return NextResponse.json({ 
        error: 'Member tidak ditemukan' 
      }, { status: 404 });
    }

    // Flatten the response structure
    const memberData = {
      id: member.id,
      nama_lengkap: member.nama_lengkap,
      nomer_wa: member.nomer_wa,
      loyalty_point: member.loyalty_point,
      bio: member.bio,
      status_kustom: member.status_kustom,
      foto_profil_url: member.foto_profil_url,
      tanggal_daftar: member.tanggal_daftar,
      clerk_id: member.clerk_id,
      username: member.user_usernames?.username || '',
      email: member.member_emails?.[0]?.email || '',
      sosmed_platform: member.profil_sosial_media?.[0]?.platform || '',
      sosmed_username: member.profil_sosial_media?.[0]?.username_sosmed || '',
    };

    return NextResponse.json({ 
      success: true, 
      member: memberData 
    });
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json({ 
      error: 'Gagal mengambil data member', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: paramId } = await params;
  const id = Number(paramId);
  if (!id) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });

  try {
    const body = await req.json();
    const {
      nama_lengkap,
      nomer_wa,
      loyalty_point,
      bio,
      status_kustom,
      foto_profil_url,
      username, // new
      email // new
    } = body;

    // Prepare update data - only include fields that are provided
    const updateData = {};
    if (nama_lengkap !== undefined) updateData.nama_lengkap = nama_lengkap;
    if (nomer_wa !== undefined) updateData.nomer_wa = nomer_wa;
    if (loyalty_point !== undefined) {
      updateData.loyalty_point = Number(loyalty_point);
      updateData.coin = Number(loyalty_point); // Keep coin in sync with loyalty_point
    }
    if (bio !== undefined) updateData.bio = bio;
    if (status_kustom !== undefined) updateData.status_kustom = status_kustom;
    if (foto_profil_url !== undefined) updateData.foto_profil_url = foto_profil_url;

    // Start transaction for member, username, and email update
    const result = await prisma.$transaction(async (tx) => {
      // Update main member data
      const updatedMember = await tx.members.update({
        where: { id },
        data: updateData,
      });

      // Update username if provided
      let updatedUsername = null;
      if (username !== undefined) {
        // Check if username already exists for another member
        const existing = await tx.user_usernames.findUnique({
          where: { username: username.toLowerCase() }
        });
        if (existing && existing.member_id !== id) {
          throw Object.assign(new Error('Username sudah digunakan oleh member lain'), { code: 'USERNAME_TAKEN' });
        }
        // Update or create username for this member
        const current = await tx.user_usernames.findUnique({ where: { member_id: id } });
        if (current) {
          updatedUsername = await tx.user_usernames.update({
            where: { member_id: id },
            data: {
              username: username.toLowerCase(),
              is_custom: true,
              display_name: nama_lengkap || current.display_name || null
            }
          });
        } else {
          updatedUsername = await tx.user_usernames.create({
            data: {
              member_id: id,
              username: username.toLowerCase(),
              is_custom: true,
              display_name: nama_lengkap || null
            }
          });
        }
      }

      // Update email if provided
      let updatedEmail = null;
      if (email !== undefined) {
        // Get the member's clerk_id
        const member = await tx.members.findUnique({ where: { id } });
        if (!member || !member.clerk_id) {
          throw Object.assign(new Error('Member tidak memiliki clerk_id'), { code: 'NO_CLERK_ID' });
        }
        // Only update the primary email
        const currentPrimary = await tx.member_emails.findFirst({
          where: { clerk_id: member.clerk_id, is_primary: true }
        });
        if (currentPrimary) {
          updatedEmail = await tx.member_emails.update({
            where: { id: currentPrimary.id },
            data: { email }
          });
        } else {
          updatedEmail = await tx.member_emails.create({
            data: {
              clerk_id: member.clerk_id,
              email,
              is_primary: true
            }
          });
        }
      }

      return { updatedMember, updatedUsername, updatedEmail };
    });

    return NextResponse.json({
      success: true,
      member: result.updatedMember,
      username: result.updatedUsername,
      email: result.updatedEmail
    });
  } catch (error) {
    console.error('Error updating member:', error);
    // Custom error for username taken
    if (error.code === 'USERNAME_TAKEN') {
      return NextResponse.json({
        error: 'Username sudah digunakan oleh member lain',
        details: error.message
      }, { status: 409 });
    }
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json({
        error: 'Data duplikat ditemukan',
        details: 'Field yang diupdate sudah ada di database'
      }, { status: 400 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({
        error: 'Member tidak ditemukan',
        details: `Member dengan ID ${id} tidak ada`
      }, { status: 404 });
    }
    return NextResponse.json({
      error: 'Gagal mengupdate member',
      details: error.message
    }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id: paramId } = await params;
  const id = Number(paramId);
  if (!id) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  try {
    await prisma.members.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Gagal menghapus member' }, { status: 500 });
  }
}
