'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SubdomainHandler() {
  const router = useRouter();

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    console.log('🔍 SUBDOMAIN HANDLER:', { hostname, pathname });

    // Handle admin subdomain
    if (hostname === 'admin.berkomunitas.com') {
      console.log('🔄 Admin subdomain detected, redirecting to admin-app');
      
      // Redirect to admin-app path
      if (pathname === '/') {
        window.location.href = '/admin-app';
      } else if (pathname === '/dashboard') {
        window.location.href = '/admin-app/dashboard';
      } else if (!pathname.startsWith('/admin-app')) {
        window.location.href = `/admin-app${pathname}`;
      }
      return;
    }

    // Handle rewards subdomain
    if (hostname === 'rewards.berkomunitas.com') {
      console.log('🔄 Rewards subdomain detected, redirecting to rewards-app');
      
      // Redirect to rewards-app path
      if (pathname === '/') {
        window.location.href = '/rewards-app';
      } else if (!pathname.startsWith('/rewards-app')) {
        window.location.href = `/rewards-app${pathname}`;
      }
      return;
    }

  }, [router]);

  return null; // This component doesn't render anything
}
