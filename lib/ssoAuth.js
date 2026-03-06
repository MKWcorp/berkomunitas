/**
 * SSO Authentication Helper for API Routes
 * Replace Clerk's currentUser() with SSO JWT verification
 */

import prisma from '@/utils/prisma';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

console.log('[ssoAuth] JWT_SECRET loaded:', process.env.JWT_SECRET ? `${process.env.JWT_SECRET.length} chars` : 'undefined');

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
    const cookieHeader = request.headers.get('cookie');
    let token = null;

    console.log('[ssoAuth] Auth header:', authHeader ? 'EXISTS' : 'MISSING');
    console.log('[ssoAuth] Cookie header:', cookieHeader ? 'EXISTS' : 'MISSING');
    if (cookieHeader) {
      console.log('[ssoAuth] Cookie header value:', cookieHeader);
    }

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('[ssoAuth] Token from Authorization header');
    } else {
      // Try to get from cookies
      if (cookieHeader) {
        const tokenMatch = cookieHeader.match(/access_token=([^;]+)/);
        if (tokenMatch) {
          token = tokenMatch[1];
          console.log('[ssoAuth] Token from cookie');
        }
      }
    }

    if (!token) {
      console.log('[ssoAuth] No token found in request');
      return null;
    }

    // Verify JWT token using jose (Edge-compatible, same as middleware)
    console.log('[ssoAuth] Verifying token with JWT_SECRET length:', JWT_SECRET ? JWT_SECRET.length : 'undefined');
    console.log('[ssoAuth] JWT_SECRET first 20:', JWT_SECRET ? JWT_SECRET.substring(0, 20) : 'N/A');
    console.log('[ssoAuth] Token first 50 chars:', token ? token.substring(0, 50) : 'N/A');
    
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload: decoded } = await jwtVerify(token, secretKey);
    console.log('[ssoAuth] Token verified successfully, memberId:', decoded.memberId);
    
    // Get user from database
    const user = await prisma.members.findUnique({
      where: { id: decoded.memberId },
      select: {
        id: true,
        email: true,
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
