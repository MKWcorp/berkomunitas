'use client';
import { usePathname } from 'next/navigation';
import GlassLayout from '@/components/GlassLayout';
import AdminNavigationMenu from './AdminNavigationMenu';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  
  const _isActive = (href) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <GlassLayout variant="admin" className="min-h-screen">
      <AdminNavigationMenu />
      <div className="max-w-7xl mx-auto p-6">
        {children}
      </div>
    </GlassLayout>
  );
}
