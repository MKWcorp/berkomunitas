import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/check
 * Check if current user has admin privileges
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        isAdmin: false 
      }, { status: 401 });
    }

    // Check if user is admin
    const adminPrivilege = await prisma.user_privileges.findFirst({
      where: { member_id: user.id,
        privilege: 'admin',
        is_active: true
      }
    });

    const isAdmin = !!adminPrivilege;

    if (isAdmin) {
      return NextResponse.json({ 
        success: true,
        isAdmin: true,
        message: 'Admin access confirmed',
        userId: userId
      });
    } else {
      return NextResponse.json({ 
        success: false,
        isAdmin: false,
        message: 'Admin access denied' 
      }, { status: 403 });
    }

  } catch (error) {
    console.error('GET /api/admin/check error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      isAdmin: false,
      details: error.message 
    }, { status: 500 });
  }
}
