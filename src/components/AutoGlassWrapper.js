'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import GlassLayout from './GlassLayout';

/**
 * AutoGlassWrapper - Apply original main branch styling for public pages
 */
export default function AutoGlassWrapper({ children }) {
  const pathname = usePathname();
  
  // Routes yang tidak perlu glass effect
  const noGlassRoutes = ['/api', '/sitemap', '/_next', '/favicon'];
  const shouldApplyGlass = !noGlassRoutes.some(route => pathname.startsWith(route));

  // Detect admin routes
  const isAdminRoute = pathname.startsWith('/admin-app');

  useEffect(() => {
    // Set body background for public pages (original main branch style)
    if (!isAdminRoute) {
      document.body.style.background = 'radial-gradient(ellipse at bottom right, rgba(59, 130, 246, 0.15), rgba(245, 245, 244, 0.95)), linear-gradient(135deg, #fafaf9 0%, #f8fafc 50%, #dbeafe 100%)';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundRepeat = 'no-repeat';
    } else {
      // Reset body background for admin pages
      document.body.style.background = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundRepeat = '';
    }

    return () => {
      // Cleanup on unmount
      if (!isAdminRoute) {
        document.body.style.background = '';
        document.body.style.backgroundAttachment = '';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundRepeat = '';
      }
    };
  }, [isAdminRoute]);

  // Skip glass untuk halaman yang sudah punya background custom
  if (!shouldApplyGlass) {
    return <>{children}</>;
  }

  if (isAdminRoute) {
    // Untuk halaman admin, gunakan GlassLayout dengan variant admin
    return (
      <GlassLayout 
        variant="admin"
        showAnimatedBg={!pathname.includes('/print')}
        className="admin-glass-wrapper"
        containerClassName="p-0"
      >
        {children}
      </GlassLayout>
    );
  } else {
    // Untuk halaman publik, kembalikan children langsung (background handled by body)
    return <>{children}</>;
  }
}

/**
 * GlassThemeProvider - Provider untuk global glass settings
 */
export function GlobalGlassProvider({ children }) {
  return (
    <AutoGlassWrapper>
      {children}
    </AutoGlassWrapper>
  );
}
