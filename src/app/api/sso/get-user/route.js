/**
 * SSO API: Get User Data
 * Fetch full user data from database based on JWT token (email-based)
 */
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user from database by EMAIL (SSO identifier)
    const member = await prisma.members.findUnique({
      where: { email: decoded.email },
      select: {
        id: true,
        email: true,
        google_id: true,
        nama_lengkap: true,
        foto_profil_url: true,
        nomer_wa: true,
        coin: true,
        loyalty_point: true,
        bio: true,
        status_kustom: true,
        tanggal_daftar: true,
        last_login_at: true,
        sso_metadata: true,
        // Relations (optional)
        user_usernames: {
          select: {
            username: true,
            display_name: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data (no Clerk ID!)
    return NextResponse.json({
      id: member.id, // Member ID (primary key)
      email: member.email, // SSO identifier
      googleId: member.google_id,
      fullName: member.nama_lengkap,
      imageUrl: member.foto_profil_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.nama_lengkap || 'User')}&background=random`,
      whatsapp: member.nomer_wa,
      coin: member.coin,
      loyaltyPoint: member.loyalty_point,
      bio: member.bio,
      status: member.status_kustom,
      registeredAt: member.tanggal_daftar,
      lastLoginAt: member.last_login_at,
      ssoMetadata: member.sso_metadata,
      username: member.user_usernames?.username,
      displayName: member.user_usernames?.display_name || member.nama_lengkap,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}
