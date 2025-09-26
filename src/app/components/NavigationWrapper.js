'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import NavigationMenu from './NavigationMenu';

export default function NavigationWrapper() {
  const pathname = usePathname();
  const [isAdminSubdomain, setIsAdminSubdomain] = useState(false);

  useEffect(() => {
    // Check if we're in admin or rewards subdomain, or admin-app routes
    const hostname = window.location.hostname;
    const isAdmin = hostname === 'admin.berkomunitas.com' || 
                   hostname === 'admin.localhost' ||
                   pathname?.startsWith('/admin-app');
    const isRewards = hostname === 'rewards.berkomunitas.com' || 
                     hostname === 'rewards.localhost' ||
                     pathname?.startsWith('/rewards-app');
    
    setIsAdminSubdomain(isAdmin || isRewards);
  }, [pathname]);

  // Don't render NavigationMenu for admin or rewards subdomains/routes
  if (isAdminSubdomain) {
    return null;
  }

  // Render NavigationMenu for main app only
  return <NavigationMenu />;
}
