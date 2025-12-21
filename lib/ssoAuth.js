/**
 * SSO Authentication Helper for API Routes
 * Replace Clerk's currentUser() with SSO JWT verification
 */

import prisma from '@/utils/prisma';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Get current user from JWT token (SSO equivalent of Clerk's currentUser())
 * @param {Request} request - Next.js request object
 * @returns {Promise<{id: number, email: string, google_id: string|null, ...}>}
 */
export async function getCurrentUser(request) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    let token = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Try to get from cookies
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const tokenMatch = cookies.match(/access_token=([^;]+)/);
        if (tokenMatch) {
          token = tokenMatch[1];
        }
      }
    }

    if (!token) {
      return null;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const user = await prisma.members.findUnique({
      where: { id: decoded.memberId },
      select: {
        id: true,
        email: true,
        google_id: true,
        google_id: true,
        nama_lengkap: true,
        nomer_wa: true,
        foto_profil_url: true,
        bio: true,
        status_kustom: true,
        coin: true,
        loyalty_point: true,
        tanggal_daftar: true,
        last_login_at: true,
      },
    });

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('SSO Auth Error:', error.message);
    return null;
  }
}

/**
 * Require authentication - throw 401 if not authenticated
 * @param {Request} request 
 * @returns {Promise<{id: number, email: string, ...}>}
 */
export async function requireAuth(request) {
  const user = await getCurrentUser(request);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}

/**
 * Middleware to verify SSO token in API routes
 * Usage: export const middleware = withSSOAuth;
 */
export async function withSSOAuth(request) {
  const user = await getCurrentUser(request);
  
  if (!user) {
    return unauthorizedResponse();
  }
  
  // Attach user to request for later use
  request.user = user;
  return NextResponse.next();
}
