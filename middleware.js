import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function middleware(request) {
  const hostname = request.nextUrl.hostname;
  const pathname = request.nextUrl.pathname;
  const url = request.nextUrl.clone();

  // Force logging to Vercel console - Enhanced debugging v3
  console.log('==========================================');
  console.log(`🔍 MIDDLEWARE DEBUG: ${new Date().toISOString()}`);
  console.log(`Host: ${hostname}`);
  console.log(`Path: ${pathname}`);
  console.log(`Full URL: ${request.nextUrl.toString()}`);
  console.log(`Headers: ${JSON.stringify(Object.fromEntries(request.headers.entries()))}`);
  console.log('==========================================');

  // Handle BerkomunitasPlus routing - simplified approach
  if (pathname.startsWith('/plus')) {
    // Skip middleware for API calls from these pages
    if (pathname.startsWith('/plus/api')) {
      return NextResponse.next();
    }
    
    // Let the pages handle their own logic, but ensure no caching
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  // Handle admin subdomain - More comprehensive matching
  const isAdminSubdomain = hostname === 'admin.berkomunitas.com' || 
                          hostname.startsWith('admin.') || 
                          hostname === 'admin.localhost' || 
                          (hostname === 'localhost' && pathname.startsWith('/admin-subdomain'));
  
  if (isAdminSubdomain) {
    console.log(`🔄 ADMIN SUBDOMAIN DETECTED!`);
    console.log(`Original: ${hostname}${pathname}`);
    
    // Skip middleware for static files and API routes
    if (pathname.startsWith('/_next/') || 
        pathname.startsWith('/api/') || 
        pathname.startsWith('/favicon.ico') ||
        pathname.includes('.')) {
      console.log(`⏭️ SKIP: Static/API file - ${pathname}`);
      return NextResponse.next();
    }
    
    // Rewrite to admin-app folder
    if (pathname === '/') {
      url.pathname = '/admin-app';
      console.log(`✅ ROOT REWRITE TO: /admin-app`);
    } else if (pathname === '/dashboard') {
      url.pathname = '/admin-app/dashboard';
      console.log(`✅ DASHBOARD REWRITE TO: /admin-app/dashboard`);
    } else if (!pathname.startsWith('/admin-app')) {
      url.pathname = `/admin-app${pathname}`;
      console.log(`✅ PATH REWRITE TO: /admin-app${pathname}`);
    } else {
      console.log(`⏭️ Already admin-app path: ${pathname}`);
      return NextResponse.next();
    }
    
    console.log(`🎯 FINAL REWRITE URL: ${url.toString()}`);
    return NextResponse.rewrite(url);
  }

  // Handle rewards subdomain  
  const isRewardsSubdomain = hostname === 'rewards.berkomunitas.com' || 
                            hostname.startsWith('rewards.') ||
                            hostname === 'rewards.localhost' || 
                            (hostname === 'localhost' && pathname.startsWith('/rewards-subdomain'));

  if (isRewardsSubdomain) {
    console.log(`🔄 REWARDS SUBDOMAIN DETECTED!`);
    console.log(`Original: ${hostname}${pathname}`);
    
    // Skip middleware for static files and API routes
    if (pathname.startsWith('/_next/') || 
        pathname.startsWith('/api/') || 
        pathname.startsWith('/favicon.ico') ||
        pathname.includes('.')) {
      console.log(`⏭️ SKIP: Static/API file - ${pathname}`);
      return NextResponse.next();
    }
    
    // Rewrite to rewards-app folder
    if (pathname === '/') {
      url.pathname = '/rewards-app';
      console.log(`✅ REWARDS ROOT REWRITE TO: /rewards-app`);
    } else if (!pathname.startsWith('/rewards-app')) {
      url.pathname = `/rewards-app${pathname}`;
      console.log(`✅ REWARDS PATH REWRITE TO: /rewards-app${pathname}`);
    } else {
      console.log(`⏭️ Already rewards-app path: ${pathname}`);
      return NextResponse.next();
    }
    
    console.log(`🎯 FINAL REWARDS REWRITE URL: ${url.toString()}`);
    return NextResponse.rewrite(url);
  }

  // Skip middleware for direct admin-app access on main domain
  if (hostname === 'berkomunitas.com' && pathname.startsWith('/admin-app')) {
    console.log(`⏭️ SKIP: Direct admin-app access on main domain`);
    return NextResponse.next();
  }

  // Skip middleware for direct rewards-app access on main domain  
  if (hostname === 'berkomunitas.com' && pathname.startsWith('/rewards-app')) {
    console.log(`⏭️ SKIP: Direct rewards-app access on main domain`);
    return NextResponse.next();
  }

  // Default: main app (no rewrite needed for main domain)
  console.log(`➡️ No rewrite needed: ${hostname}${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all requests except:
     * - api (API routes) 
     * - _next (Next.js internals)
     * - static files (images, fonts, etc.)
     */
    '/((?!api|_next|.*\\.).*)',
  ],
};
