import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
// POST - Grant berkomunitasplus privilege (Admin only)
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin privilege
    const adminPrivilege = await prisma.$queryRaw`
      SELECT * FROM user_privileges 
      WHERE clerk_id = ${userId} 
      AND privilege = 'admin' 
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    `;

    if (adminPrivilege.length === 0) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userClerkId, userEmail, duration_days } = await request.json();

    if (!userClerkId && !userEmail) {
      return NextResponse.json(
        { error: 'User Clerk ID or email is required' },
        { status: 400 }
      );
    }

    // Calculate expiry date if duration specified
    let expiresAt = null;
    if (duration_days && duration_days > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + duration_days);
    }

    // Grant berkomunitasplus privilege
    const privilege = await prisma.$queryRaw`
      INSERT INTO user_privileges (clerk_id, user_email, privilege, is_active, expires_at, created_at)
      VALUES (${userClerkId}, ${userEmail}, 'berkomunitasplus', true, ${expiresAt}, NOW())
      ON CONFLICT (clerk_id, privilege) 
      DO UPDATE SET 
        is_active = true, 
        expires_at = ${expiresAt},
        updated_at = NOW()
      RETURNING id, clerk_id, user_email, privilege, is_active, expires_at, created_at
    `;

    return NextResponse.json({
      success: true,
      data: privilege[0],
      message: 'Berkomunitas+ privilege granted successfully'
    });

  } catch (error) {
    console.error('Error granting berkomunitasplus privilege:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to grant privilege' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Revoke berkomunitasplus privilege (Admin only)
export async function DELETE(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin privilege
    const adminPrivilege = await prisma.$queryRaw`
      SELECT * FROM user_privileges 
      WHERE clerk_id = ${userId} 
      AND privilege = 'admin' 
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    `;

    if (adminPrivilege.length === 0) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userClerkId = searchParams.get('userClerkId');

    if (!userClerkId) {
      return NextResponse.json(
        { error: 'User Clerk ID is required' },
        { status: 400 }
      );
    }

    // Revoke berkomunitasplus privilege
    await prisma.$executeRawUnsafe(`
      UPDATE user_privileges 
      SET is_active = false, updated_at = NOW()
      WHERE clerk_id = '${userClerkId}' AND privilege = 'berkomunitasplus'
    `);

    return NextResponse.json({
      success: true,
      message: 'Berkomunitas+ privilege revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking berkomunitasplus privilege:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to revoke privilege' 
      },
      { status: 500 }
    );
  }
}

// GET - List users with berkomunitasplus privilege (Admin only)
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin privilege
    const adminPrivilege = await prisma.$queryRaw`
      SELECT * FROM user_privileges 
      WHERE clerk_id = ${userId} 
      AND privilege = 'admin' 
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    `;

    if (adminPrivilege.length === 0) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all berkomunitasplus users
    const users = await prisma.$queryRaw`
      SELECT 
        up.id,
        up.clerk_id,
        up.user_email,
        up.privilege,
        up.is_active,
        up.expires_at,
        up.created_at,
        m.nama_lengkap,
        m.email as member_email
      FROM user_privileges up
      LEFT JOIN members m ON up.clerk_id = m.clerk_id
      WHERE up.privilege = 'berkomunitasplus'
      ORDER BY up.created_at DESC
    `;

    return NextResponse.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Error fetching berkomunitasplus users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch users' 
      },
      { status: 500 }
    );
  }
}