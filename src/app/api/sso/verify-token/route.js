/**
 * SSO API: Verify Token
 * Verify JWT access token and return user data
 */
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user data
    const member = await prisma.members.findUnique({
      where: { id: decoded.memberId },
      select: {
        id: true,
        email: true,
        nama_lengkap: true,
        google_id: true,
        foto_profil_url: true,
        coin: true,
        loyalty_point: true,
        last_login_at: true,
        user_privileges: {
          select: {
            privilege: true,
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

    // Update last activity
    await prisma.platformSession.updateMany({
      where: {
        member_id: member.id,
        jwt_token: token,
      },
      data: {
        last_activity_at: new Date(),
      },
    });

    // Check if user is admin
    const isAdmin = member.user_privileges.some(
      p => p.privilege === 'admin' || p.privilege === 'super_admin'
    );

    return NextResponse.json({
      success: true,
      user: {
        id: member.id,
        email: member.email,
        name: member.nama_lengkap,
        photo: member.foto_profil_url,
        googleId: member.google_id,
        coin: member.coin,
        loyaltyPoint: member.loyalty_point,
        isAdmin,
        lastLoginAt: member.last_login_at,
      },
    });
  } catch (error) {
    console.error('Token Verification Error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Token verification failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
