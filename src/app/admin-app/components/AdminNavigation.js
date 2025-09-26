'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser, SignedIn } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  TrophyIcon,
  CalendarIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import UserProfileDropdown from '../../components/UserProfileDropdown';

export default function AdminNavigation() {
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSubdomain, setIsSubdomain] = useState(false);
  const pathname = usePathname();

  // Check if we're on admin subdomain
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSubdomain(window.location.hostname === 'admin.berkomunitas.com');
    }
  }, []);

  // Create navigation links based on domain
  const getAdminLinks = () => {
    const baseHrefs = [
      { path: 'dashboard', label: 'Dashboard', icon: HomeIcon },
      { path: 'members', label: 'Members', icon: UserGroupIcon },
      { path: 'tasks', label: 'Tasks', icon: ClipboardDocumentListIcon },
      { path: 'badges', label: 'Badges', icon: TrophyIcon },
      { path: 'events', label: 'Events', icon: CalendarIcon },
      { path: 'loyalty', label: 'Loyalty', icon: ChartBarIcon },
      { path: 'social-media', label: 'Social Media', icon: UserGroupIcon },
      { path: 'privileges', label: 'Privileges', icon: ShieldCheckIcon },
    ];

    return baseHrefs.map(({ path, label, icon }) => ({
      href: isSubdomain ? `/${path}` : `/admin-app/${path}`,
      label,
      icon
    }));
  };

  const adminLinks = getAdminLinks();

  const isActive = (href) => {
    if (isSubdomain) {
      if (href === '/dashboard') {
        return pathname === '/' || pathname === '/dashboard';
      }
      return pathname === href;
    } else {
      if (href === '/admin-app/dashboard') {
        return pathname === '/admin-app' || pathname === '/admin-app/dashboard';
      }
      return pathname === href;
    }
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href={isSubdomain ? '/dashboard' : '/admin-app/dashboard'} className="flex items-center">
              <img 
                src="/logo-b.svg" 
                alt="Komunitas Komentar Logo" 
                className="w-8 h-8 object-contain"
              />
            </Link>
          </div>          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1">
            {adminLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.href)
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* User Profile Section */}
          <div className="flex items-center space-x-4">
            <SignedIn>
              {/* User info display */}
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-500">Administrator</div>
                </div>
                <UserProfileDropdown />
              </div>
              
              {/* Mobile User Profile */}
              <div className="sm:hidden">
                <UserProfileDropdown />
              </div>
            </SignedIn>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200/50">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white/95 backdrop-blur-md">
            {adminLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 ${
                    isActive(link.href)
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className="w-5 h-5 mr-3" />
                  {link.label}
                </Link>
              );
            })}
          </div>
          
          {/* Mobile User Info */}
          <SignedIn>
            <div className="px-4 py-3 border-t border-gray-200/50 bg-gray-50/80">
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {user?.primaryEmailAddress?.emailAddress}
                  </div>
                  <div className="text-xs text-blue-600 font-medium">Administrator</div>
                </div>
              </div>
            </div>
          </SignedIn>
        </div>
      )}
    </nav>
  );
}
