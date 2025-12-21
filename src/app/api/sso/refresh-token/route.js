/**
 * SSO API: Refresh Token
 * Refresh expired access token using refresh token
 */
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export async function POST(request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    // Get user
    const member = await prisma.members.findUnique({
      where: { id: decoded.memberId },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify refresh token exists in database
    const session = await prisma.platformSession.findFirst({
      where: {
        member_id: member.id,
        refresh_token: refreshToken,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        memberId: member.id,
        email: member.email,
        googleId: member.google_id,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update session with new access token
    await prisma.platformSession.update({
      where: { id: session.id },
      data: {
        jwt_token: newAccessToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        last_activity_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error('Refresh Token Error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
