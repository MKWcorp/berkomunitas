// SSO Middleware - Simple route protection like Clerk
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Public routes that ANYONE can access (no auth needed)
const publicRoutes = [
  "/",
  "/login",
  "/sign-in",
  "/sign-up", 
  "/api/sso",
  "/api/webhooks",
  "/faq",
  "/landing",
  "/user-guide",
  "/privacy-policy",
  "/api/dashboard", // Public dashboard stats
];

// Routes that REQUIRE authentication
const protectedRoutes = [
  "/profil",
  "/tugas",
  "/rewards",
  "/loyalty",
  "/coins",
  "/security",
  "/plus",
  "/leaderboard",
  "/custom-dashboard",
  "/rewards-app",
  "/api/profil",
  "/api/tugas/submit",
  "/api/rewards",
  "/api/admin",
  "/api/custom-dashboard",
];

// Helper function to check if path matches route pattern
function matchesRoute(pathname, routes) {
  return routes.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

// Helper function to verify JWT token
async function verifyToken(token) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

export default async function middleware(req) {
  const { pathname } = req.nextUrl;
  
  console.log('[SSO Middleware]', pathname);

  // 1. Allow static files and Next.js internals
  if (pathname.startsWith('/_next') ||
      pathname.includes('.') ||
      pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // 2. Redirect old Clerk routes to SSO login
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 3. Maintenance mode check
  const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';
  if (MAINTENANCE_MODE) {
    if (pathname === '/maintenance') return NextResponse.next();
    if (pathname.startsWith('/api/webhooks') || 
        pathname.startsWith('/api/webhook') ||
        pathname.startsWith('/api/sso')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/maintenance', req.url));
  }

  // 4. Check if route is public (allow without auth)
  if (matchesRoute(pathname, publicRoutes)) {
    return NextResponse.next();
  }
  // 5. Check if route is protected (requires auth)
  if (matchesRoute(pathname, protectedRoutes)) {
    // Get token from cookies or Authorization header
    const accessToken = req.cookies.get('access_token')?.value || 
                       req.headers.get('authorization')?.replace('Bearer ', '');
    
    console.log('[SSO Middleware] Protected route:', pathname, 'Token:', accessToken ? 'EXISTS' : 'MISSING');
    
    if (!accessToken) {
      // For API routes, return 401 Unauthorized
      if (pathname.startsWith('/api/')) {
        console.log('[SSO Middleware] API route without token - returning 401');
        return NextResponse.json(
          { success: false, message: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // For pages, redirect to login with return URL
      console.log('[SSO Middleware] Page without token - redirecting to login');
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token is valid
    const payload = await verifyToken(accessToken);
    console.log('[SSO Middleware] Token verification:', payload ? 'VALID' : 'INVALID');
    
    if (!payload) {
      // Token invalid or expired
      if (pathname.startsWith('/api/')) {
        console.log('[SSO Middleware] API route with invalid token - returning 401');
        return NextResponse.json(
          { success: false, message: 'Invalid or expired token' },
          { status: 401 }
        );
      }
      
      console.log('[SSO Middleware] Page with invalid token - redirecting to login');
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Token valid - add user info to headers for API routes
    console.log('[SSO Middleware] Token valid - allowing access');
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.userId?.toString() || '');
    response.headers.set('x-user-email', payload.email || '');
    return response;
  }

  // 6. Default: allow the request (for routes not explicitly protected)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
