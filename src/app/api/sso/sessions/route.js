// SSO Sessions API - List active sessions for current user
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get all active sessions for this user from PlatformSession table
    const sessions = await prisma.platformSession.findMany({
      where: {
        member_id: user.id,
        expires_at: {
          gt: new Date() // Only active sessions
        }
      },
      orderBy: {
        last_activity_at: 'desc'
      },
      select: {
        id: true,
        token: true,
        device_info: true,
        ip_address: true,
        user_agent: true,
        created_at: true,
        last_activity_at: true,
        expires_at: true
      }
    });

    // Get current session token from cookie
    const cookies = request.headers.get('cookie') || '';
    const currentToken = cookies.split(';')
      .find(c => c.trim().startsWith('sso_token='))
      ?.split('=')[1];

    // Format sessions for frontend
    const formattedSessions = sessions.map(session => ({
      id: session.id.toString(),
      isCurrent: session.token === currentToken,
      userAgent: session.user_agent || 'Unknown',
      deviceType: parseDeviceType(session.user_agent),
      ipAddress: session.ip_address,
      createdAt: session.created_at,
      lastActivityAt: session.last_activity_at,
      expiresAt: session.expires_at
    }));

    return NextResponse.json({
      success: true,
      sessions: formattedSessions
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// Helper function to determine device type from user agent
function parseDeviceType(userAgent) {
  if (!userAgent) return 'desktop';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  }
  
  return 'desktop';
}
