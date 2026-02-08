'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSSOUser } from '@/hooks/useSSOUser';
import { useState, useEffect, useRef } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  CircleStackIcon,
  StarIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import NotificationBell from '../../components/NotificationBell';
import UserProfileDropdown from '../../components/UserProfileDropdown';

// Custom Hook to check profile completeness (same as original)
function useProfileCompleteness() {
  const [isComplete, setIsComplete] = useState(true);
  const { isSignedIn } = useSSOUser();

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/profil/check-completeness', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          setIsComplete(data.isComplete || false);
        })
        .catch(() => setIsComplete(false));
    } else {
      setIsComplete(true);
    }
  }, [isSignedIn]);

  return isComplete;
}

export default function AdminNavigationMenu() {
  const isProfileComplete = useProfileCompleteness();
  const { user, isSignedIn } = useSSOUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Admin navigation links with optional submenu
  const adminNavLinks = [
    { href: '/admin-app/dashboard', label: 'Dashboard', icon: HomeIcon, signedIn: true },
    { href: '/admin-app/members', label: 'Members', icon: UserGroupIcon, signedIn: true },
    { 
      href: '/admin-app/tasks', 
      label: 'Tasks', 
      icon: ClipboardDocumentListIcon, 
      signedIn: true,
      submenu: [
        { href: '/admin-app/tasks', label: 'All Tasks' },
        { href: '/admin-app/add-task', label: 'Add Task' }
      ]
    },
    { href: '/admin-app/badges', label: 'Badges', icon: StarIcon, signedIn: true },
    { href: '/admin-app/events', label: 'Events', icon: CalendarIcon, signedIn: true },
    { href: '/admin-app/points', label: 'Monitoring Poin', icon: ChartBarIcon, signedIn: true },
    { href: '/admin-app/loyalty', label: 'Loyalty', icon: CurrencyDollarIcon, signedIn: true },
    { href: '/admin-app/coins', label: 'Coins', icon: CircleStackIcon, signedIn: true },
    { href: '/admin-app/social-media', label: 'Akun', icon: BuildingOfficeIcon, signedIn: true },
    { href: '/admin-app/privileges', label: 'Privileges', icon: ShieldCheckIcon, signedIn: true },
  ];

  // Filter links for signed-in users only
  const filteredLinks = adminNavLinks.filter(link =>
    (!link.signedIn || isSignedIn)
  );

  // Check if current link is active
  const isActiveLink = (href) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 text-gray-900 sticky top-0 z-50 shadow-xl">
      <nav className="container mx-auto px-4 flex justify-between items-center h-16">
        {/* Logo and Menu */}
        <div className="flex items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center mr-4 hover:opacity-80 transition-opacity">
            <Image
              src="/logo-b.png"
              alt="Logo"
              width={40}
              height={40}
              className="h-10 w-10"
            />
          </Link>

          {/* Hamburger for mobile */}
          <button
            className="md:hidden p-2 focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop menu */}
          <div className="hidden md:flex space-x-4">
            {filteredLinks.map(link => {
              const IconComponent = link.icon;
              const isActive = isActiveLink(link.href);
              const hasSubmenu = link.submenu && link.submenu.length > 0;
              
              if (hasSubmenu) {
                return (
                  <div key={link.href} className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === link.label ? null : link.label)}
                      className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-2 backdrop-blur-sm border ${
                        isActive 
                          ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 border-blue-400/30' 
                          : 'bg-white/10 hover:bg-white/20 hover:text-indigo-600 border-white/20'
                      }`}
                    >
                      {IconComponent && <IconComponent className="w-4 h-4" />}
                      {link.label}
                      <ChevronDownIcon className={`w-3 h-3 transition-transform ${openDropdown === link.label ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {openDropdown === link.label && (
                      <div 
                        className="absolute top-full left-0 mt-2 w-48 bg-white/95 backdrop-blur-lg rounded-xl shadow-lg border border-white/40 overflow-hidden z-50"
                      >
                        {link.submenu.map(sublink => (
                          <Link
                            key={sublink.href}
                            href={sublink.href}
                            className={`block px-4 py-3 text-sm font-medium hover:bg-blue-500/10 transition-colors ${
                              pathname === sublink.href ? 'bg-blue-500/20 text-blue-700' : 'text-gray-700'
                            }`}
                            onClick={() => setOpenDropdown(null)}
                          >
                            {sublink.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              
              return (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-2 backdrop-blur-sm border ${
                    isActive 
                      ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 border-blue-400/30' 
                      : 'bg-white/10 hover:bg-white/20 hover:text-indigo-600 border-white/20'
                  }`}
                >
                  {IconComponent && <IconComponent className="w-4 h-4" />}
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right side: Points + Profile */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {isSignedIn && (
            <>
              <NotificationBell />
              <UserProfileDropdown />            </>
          )}

          {!isSignedIn && (
            <Link href="/login" className="bg-gradient-to-r from-indigo-500/80 to-purple-600/80 hover:from-indigo-600/90 hover:to-purple-700/90 px-3 md:px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 backdrop-blur-sm border border-white/30 text-white">
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/10 backdrop-blur-lg px-2 pt-2 pb-3 space-y-1 border-t border-white/20">
          {filteredLinks.map(link => {
            const IconComponent = link.icon;
            const isActive = isActiveLink(link.href);
            const hasSubmenu = link.submenu && link.submenu.length > 0;
            
            if (hasSubmenu) {
              return (
                <div key={link.href}>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === link.label ? null : link.label)}
                    className={`w-full flex px-4 py-3 rounded-2xl text-base font-medium transition-all duration-300 items-center gap-3 backdrop-blur-sm border ${
                      isActive 
                        ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 border-blue-400/30' 
                        : 'bg-white/10 hover:bg-white/20 hover:text-indigo-600 border-white/20'
                    }`}
                  >
                    {IconComponent && <IconComponent className="w-5 h-5" />}
                    <span className="flex-1 text-left">{link.label}</span>
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${openDropdown === link.label ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {openDropdown === link.label && (
                    <div className="ml-4 mt-1 space-y-1">
                      {link.submenu.map(sublink => (
                        <Link
                          key={sublink.href}
                          href={sublink.href}
                          className={`block px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                            pathname === sublink.href 
                              ? 'bg-blue-500/20 text-blue-700' 
                              : 'bg-white/5 hover:bg-white/10 text-gray-700'
                          }`}
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setOpenDropdown(null);
                          }}
                        >
                          {sublink.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex px-4 py-3 rounded-2xl text-base font-medium transition-all duration-300 items-center gap-3 backdrop-blur-sm border ${
                  isActive 
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 border-blue-400/30' 
                    : 'bg-white/10 hover:bg-white/20 hover:text-indigo-600 border-white/20'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {IconComponent && <IconComponent className="w-5 h-5" />}
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
