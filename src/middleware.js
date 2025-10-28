import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/faq",
  "/landing",
  "/leaderboard",
  "/api/leaderboard(.*)",
  "/api/dashboard",
  "/user-guide",
  "/privacy-policy",
  "/terms-of-service",
  "/terms",
  "/profil(.*)",
  "/api/profil(.*)",
  "/tugas",
  "/tugas/(.*)",
  "/api/tugas/(.*)",
  "/custom-dashboard/drwcorp",
  "/api/custom-dashboard/drwcorp"
]);

const isProtectedRoute = createRouteMatcher([
  "/custom-dashboard(.*)",
  "/api/custom-dashboard(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow static files immediately
  if (req.nextUrl.pathname.startsWith('/_next') ||
      req.nextUrl.pathname.includes('.') ||
      req.nextUrl.pathname === '/favicon.ico') {
    return;
  }

  // Force social-only authentication for sign-in and sign-up routes
  if (req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up')) {
    // Allow access to social login pages
    return;
  }

  // If maintenance mode enabled, redirect all non-exempt routes to /maintenance
  const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';
  if (MAINTENANCE_MODE) {
    // Allow the maintenance page itself to avoid redirect loop
    if (req.nextUrl.pathname === '/maintenance') return;

    // Allow Clerk webhooks and other critical API endpoints to function
    if (req.nextUrl.pathname.startsWith('/api/webhooks') || req.nextUrl.pathname.startsWith('/api/webhook')) {
      return;
    }

    // Allow static assets already handled above; everything else redirect
    return NextResponse.redirect(new URL('/maintenance', req.url));
  }

  // For protected routes, ensure user is authenticated
  if (isProtectedRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      // Redirect to sign-in if not authenticated
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
  }

  // Allow public routes
  if (isPublicRoute(req)) {
    return;
  }

  // Default: allow the request
  return;
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
