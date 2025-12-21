// SSO Revoke Session API - Sign out from specific device
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Delete the session from database
    const deletedSession = await prisma.platformSession.delete({
      where: {
        id: parseInt(sessionId),
        member_id: user.id // Ensure user can only delete their own sessions
      }
    });

    if (!deletedSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get current session token to check if user is signing out current device
    const cookies = request.headers.get('cookie') || '';
    const currentToken = cookies.split(';')
      .find(c => c.trim().startsWith('sso_token='))
      ?.split('=')[1];

    const isCurrentSession = deletedSession.token === currentToken;

    // If revoking current session, clear the cookie
    const response = NextResponse.json({
      success: true,
      message: 'Session revoked successfully',
      isCurrentSession
    });

    if (isCurrentSession) {
      response.cookies.set('sso_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // Expire immediately
        path: '/'
      });

      response.cookies.set('sso_refresh_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
      });
    }

    return response;

  } catch (error) {
    console.error('Error revoking session:', error);
    
    // Handle case where session was already deleted
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to revoke session' },
      { status: 500 }
    );
  }
}
