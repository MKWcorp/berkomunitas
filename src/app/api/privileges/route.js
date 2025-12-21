import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
import { grantPrivilege, revokePrivilege } from '../../../utils/privilegeChecker';
// GET - List all privileges for the authenticated user (or all if admin)
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If ?userClerkId=... is provided, only allow if requester is admin
    const { searchParams } = new URL(request.url);
    const user_clerk_id = searchParams.get('userClerkId');

    let target_clerk_id = user_clerk_id || userId;

    // If requesting for another user, require admin privilege
    if (user_clerk_id && user_clerk_id !== userId) {
      const adminPrivilege = await prisma.user_privileges.findFirst({
        where: { member_id: user.id, // Gunakan clerk_id sesuai schema yang baru
          privilege: 'admin',
          is_active: true,
          OR: [
            { expires_at: null },
            { expires_at: { gt: new Date() } }
          ]
        }
      });
      if (!adminPrivilege) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const privileges = await prisma.user_privileges.findMany({
      where: { google_id: target_clerk_id, // Gunakan clerk_id sesuai schema yang baru
        is_active: true
      },
      orderBy: {
        granted_at: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      privileges
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data privilege' },
      { status: 500 }
    );
  }
}

// POST - Grant privilege (admin only)
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can grant privilege
    const adminPrivilege = await prisma.user_privileges.findFirst({
      where: { member_id: user.id, // Gunakan clerk_id sesuai schema yang baru
        privilege: 'admin',
        is_active: true,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ]
      }
    });
    if (!adminPrivilege) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { user_clerk_id, privilege, grantedBy, expiresAt } = body;

    if (!user_clerk_id || !privilege) {
      return NextResponse.json(
        { error: 'user_clerk_id dan privilege wajib diisi' },
        { status: 400 }
      );
    }

    const validPrivileges = ['admin', 'partner', 'user'];
    if (!validPrivileges.includes(privilege.toLowerCase())) {
      return NextResponse.json(
        { error: 'Privilege tidak valid' },
        { status: 400 }
      );
    }

    await grantPrivilege(user_clerk_id, privilege.toLowerCase(), grantedBy || userId);

    if (expiresAt) {
      await prisma.user_privileges.updateMany({
        where: { google_id: user_clerk_id, // Gunakan clerk_id sesuai schema yang baru
          privilege: privilege.toLowerCase()
        },
        data: {
          expires_at: new Date(expiresAt)
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Privilege ${privilege} berhasil diberikan kepada ${userClerkId}`
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memberikan privilege' },
      { status: 500 }
    );
  }
}

// DELETE - Revoke privilege (admin only)
export async function DELETE(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can revoke privilege
    const adminPrivilege = await prisma.user_privileges.findFirst({
      where: { member_id: user.id, // Gunakan clerk_id sesuai schema yang baru
        privilege: 'admin',
        is_active: true,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ]
      }
    });
    if (!adminPrivilege) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userClerkId = searchParams.get('userClerkId');
    const privilege = searchParams.get('privilege');

    if (!userClerkId || !privilege) {
      return NextResponse.json(
        { error: 'userClerkId dan privilege wajib diisi' },
        { status: 400 }
      );
    }

    await revokePrivilege(userClerkId, privilege.toLowerCase());

    return NextResponse.json({
      success: true,
      message: `Privilege ${privilege} berhasil dicabut dari ${userClerkId}`
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mencabut privilege' },
      { status: 500 }
    );
  }
}