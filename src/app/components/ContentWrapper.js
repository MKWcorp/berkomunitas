'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ContentWrapper({ children }) {
  const pathname = usePathname();
  const [isMainApp, setIsMainApp] = useState(true);

  useEffect(() => {
    // Check if we're in admin or rewards subdomain
    const hostname = window.location.hostname;
    const isAdmin = hostname === 'admin.berkomunitas.com' || 
                   hostname === 'admin.localhost' ||
                   pathname?.startsWith('/admin-app');
    const isRewards = hostname === 'rewards.berkomunitas.com' || 
                     hostname === 'rewards.localhost' ||
                     pathname?.startsWith('/rewards-app');
    
    setIsMainApp(!isAdmin && !isRewards);
  }, [pathname]);

  // For admin/rewards subdomains, render children directly without main app styling
  if (!isMainApp) {
    return children;
  }

  // For main app, use the container styling
  return (
    <div className="relative min-h-screen w-full flex flex-col">
      <main className="flex-1 flex flex-col w-full">
        <div className="container mx-auto px-4 py-6 flex-1 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
