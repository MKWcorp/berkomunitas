/**
 * SSO API: Google Login
 * Handle Google OAuth login and create/update user
 */
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export async function POST(request) {
  try {
    const { googleToken, platform } = await request.json();

    if (!googleToken) {
      return NextResponse.json(
        { error: 'Google token is required' },
        { status: 400 }
      );
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid Google token' },
        { status: 401 }
      );
    }    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return NextResponse.json(
        { error: 'Email not provided by Google' },
        { status: 400 }
      );
    }

    // Check if user exists by email OR google_id (for existing users)
    let member = await prisma.members.findFirst({
      where: {
        OR: [
          { email: email },
          { google_id: googleId },
        ],
      },
    });

    if (member) {
      // User exists - Update with Google info (auto-link old Clerk users)
      member = await prisma.members.update({
        where: { id: member.id },
        data: {
          email: email, // Update email if it was empty (old Clerk users)
          google_id: googleId, // Link Google ID
          last_login_at: new Date(),
          nama_lengkap: member.nama_lengkap || name, // Keep existing name, or use Google name
          foto_profil_url: member.foto_profil_url || picture, // Keep existing photo, or use Google photo
          sso_metadata: {
            ...(typeof member.sso_metadata === 'object' ? member.sso_metadata : {}),
            lastLoginPlatform: platform || 'Berkomunitas',
            lastLoginAt: new Date().toISOString(),
            linkedWithGoogle: true,
            googleEmail: email,
          },
        },
      });
    } else {
      // New user - Create account
      member = await prisma.members.create({
        data: {
          email,
          google_id: googleId,
          nama_lengkap: name || email.split('@')[0],
          foto_profil_url: picture,
          last_login_at: new Date(),
          tanggal_daftar: new Date(),
          loyalty_point: 0,
          coin: 0,
          sso_metadata: {
            firstLoginPlatform: platform || 'Berkomunitas',
            registeredVia: 'google_sso',
            googleEmail: email,
            picture,
          },
        },
      });
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      {
        memberId: member.id,
        email: member.email,
        googleId: member.google_id,
        platform: platform || 'Berkomunitas',
      },
      JWT_SECRET,
      { expiresIn: '7d' } // 7 days
    );

    const refreshToken = jwt.sign(
      { memberId: member.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' } // 30 days
    );

    // Save session + track activity + update member & histories in a single transaction
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const activityId = `activity_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      await prisma.$transaction([
        prisma.platformSession.create({
          data: {
            id: sessionId,
            member_id: member.id,
            platform: platform || 'Berkomunitas',
            jwt_token: accessToken,
            refresh_token: refreshToken,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
          },
        }),
        prisma.userActivity.create({
          data: {
            id: activityId,
            member_id: member.id,
            platform: platform || 'Berkomunitas',
            activity_type: 'login',
            points_earned: 1, // 1 coin for login
            metadata: {
              loginMethod: 'google',
              loginTime: new Date().toISOString(),
            },
          },
        }),
        prisma.members.update({
          where: { id: member.id },
          data: {
            coin: { increment: 1 },
            loyalty_point: { increment: 1 },
          },
        }),
        prisma.coin_history.create({
          data: {
            member_id: member.id,
            event: 'Login via Google SSO',
            coin: 1,
            event_type: 'login',
          },
        }),        prisma.loyalty_point_history.create({
          data: {
            member_id: member.id,
            event: 'Login via Google SSO',
            point: 1,
          },
        }),
      ]);

      // fetch updated member to return accurate coin/loyalty values
      const updatedMember = await prisma.members.findUnique({ where: { id: member.id } });

      return NextResponse.json({
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: updatedMember.id,
          email: updatedMember.email,
          name: updatedMember.nama_lengkap,
          photo: updatedMember.foto_profil_url,
          coin: updatedMember.coin,
          loyaltyPoint: updatedMember.loyalty_point,
        },
      });
    } catch (txError) {
      console.error('SSO Transaction Error:', txError);
      return NextResponse.json(
        { error: txError.message || 'Authentication failed (transaction)' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('SSO Login Error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
