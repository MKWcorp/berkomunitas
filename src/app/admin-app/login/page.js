/**
 * Admin Login Redirect Page
 * Redirects /admin-app/login to /admin-app (main admin entry point)
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Check if on subdomain
    if (typeof window !== 'undefined') {
      const isSubdomain = window.location.hostname === 'admin.berkomunitas.com';
      
      if (isSubdomain) {
        // On subdomain, redirect to root which will be rewritten to /admin-app
        router.replace('/');
      } else {
        // On main domain, redirect to /admin-app
        router.replace('/admin-app');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to admin login...</p>
      </div>
    </div>
  );
}
