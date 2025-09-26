'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser, SignedIn, SignedOut } from '@clerk/nextjs';
import { useState, useEffect, useRef } from 'react';
import {
  ClipboardDocumentListIcon,
  UserCircleIcon,
  TrophyIcon,
  GiftIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import NotificationBell from './NotificationBell';
import UserProfileDropdown from './UserProfileDropdown';

// Custom Hook to check profile completeness
function useProfileCompleteness() {
  const [isComplete, setIsComplete] = useState(true);
  const { isSignedIn } = useUser();

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
function useLoyaltyPoints() {
  const [points, setPoints] = useState({ loyalty_point: 0, coin: 0 });
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/profil/loyalty', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPoints({
              loyalty_point: data.loyalty_point,
              coin: data.coin
            });
          }
        })
        .catch(() => setPoints({ loyalty_point: 0, coin: 0 }));
    } else {
      setPoints({ loyalty_point: 0, coin: 0 });
    }
  }, [isSignedIn]);

  return points;
}

export default function NavigationMenu() {
  const points = useLoyaltyPoints();
  const isProfileComplete = useProfileCompleteness();
  const { isSignedIn } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRankingDropdownOpen, setIsRankingDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsRankingDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // All navigation links with icons
  const navLinks = [
    { href: '/leaderboard', label: 'Top 50', icon: TrophyIcon, signedIn: true },
    { 
      href: '/custom-dashboard/ranking', 
      label: 'Ranking', 
      icon: BuildingOfficeIcon, 
      signedIn: true,
      hasDropdown: true,
      dropdownItems: [
        { href: 'http://localhost:3000/custom-dashboard/drwcorp', label: 'Sololeveling' },
        { href: 'http://localhost:3000/custom-dashboard/ranking', label: 'Jannawana' }
      ]
    },
    { href: '/tugas', label: 'Tugas', icon: ClipboardDocumentListIcon, signedIn: true },
    { href: '/rewards', label: 'Rewards', icon: GiftIcon, signedIn: true },
  ];

  // Filter links for signed-in users only
  const filteredLinks = navLinks.filter(link =>
    (!link.signedIn || isSignedIn)
  );
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
          </button>            {/* Desktop menu */}
          <div className="hidden md:flex space-x-4">
            {filteredLinks.map(link => {
              const IconComponent = link.icon;
              
              // Handle Ranking dropdown
              if (link.hasDropdown) {
                return (
                  <div
                    key={link.href}
                    className="relative"
                    ref={dropdownRef}
                    onMouseEnter={() => setIsRankingDropdownOpen(true)}
                  >
                    {/* Main Ranking Link - Clickable */}
                    <Link
                      href={link.href}
                      className="px-4 py-2 rounded-2xl text-sm font-medium bg-white/10 hover:bg-white/20 hover:text-indigo-600 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 backdrop-blur-sm border border-white/20"
                    >
                      {IconComponent && <IconComponent className="w-4 h-4" />}
                      {link.label}
                    </Link>
                    
                    {/* Dropdown Menu - Persistent until click outside */}
                    {isRankingDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white/95 backdrop-blur-lg rounded-xl shadow-lg border border-white/30 py-2 z-50">
                        {link.dropdownItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block px-4 py-2 text-sm text-gray-800 hover:bg-white/20 hover:text-indigo-600 transition-colors duration-200"
                            onClick={() => setIsRankingDropdownOpen(false)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              
              // Regular menu items
              return (
                <Link key={link.href} href={link.href} className="px-4 py-2 rounded-2xl text-sm font-medium bg-white/10 hover:bg-white/20 hover:text-indigo-600 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 backdrop-blur-sm border border-white/20">
                  {IconComponent && <IconComponent className="w-4 h-4" />}
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Loyalty points, Coins, Notifications & Auth button always on right */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {isSignedIn && (
            <>
              {/* Loyalty Points */}
              <Link href="/loyalty" className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 hover:text-amber-600 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-white/20" title="Loyalty Points (Permanent)">
                <TrophyIcon className="w-6 h-6 text-yellow-500" />
                <span className="font-semibold text-sm md:text-base">{points.loyalty_point}</span>
              </Link>
              
              {/* Coins */}
              <Link href="/coins" className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 hover:text-green-600 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-white/20" title="Coins (Spendable)">
                <CurrencyDollarIcon className="w-6 h-6 text-green-500" />
                <span className="font-semibold text-sm md:text-base">{points.coin}</span>
              </Link>
              
              <NotificationBell />
              <UserProfileDropdown />
            </>
          )}          <SignedOut>
            <Link href="/sign-in" className="bg-gradient-to-r from-indigo-500/80 to-purple-600/80 hover:from-indigo-600/90 hover:to-purple-700/90 px-3 md:px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 backdrop-blur-sm border border-white/30 text-white">
              Login
            </Link>
          </SignedOut>
        </div>
      </nav>      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/10 backdrop-blur-lg px-2 pt-2 pb-3 space-y-1 border-t border-white/20">
          {filteredLinks.map(link => {
            const IconComponent = link.icon;
            
            // Handle Ranking dropdown in mobile
            if (link.hasDropdown) {
              return (
                <div key={link.href}>
                  {/* Main Ranking Link */}
                  <Link
                    href={link.href}
                    className="flex px-4 py-3 rounded-2xl text-base font-medium bg-white/10 hover:bg-white/20 hover:text-indigo-600 transition-all duration-300 items-center gap-3 backdrop-blur-sm border border-white/20"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {IconComponent && <IconComponent className="w-5 h-5" />}
                    {link.label}
                  </Link>
                  
                  {/* Simple Toggle for Mobile */}
                  <button
                    onClick={() => setIsRankingDropdownOpen(!isRankingDropdownOpen)}
                    className="w-full flex items-center px-4 py-2 mt-1 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                  >
                    <span>{isRankingDropdownOpen ? 'Tutup Sub Menu' : 'Buka Sub Menu'}</span>
                  </button>
                  
                  {/* Mobile dropdown items */}
                  {isRankingDropdownOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {link.dropdownItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-2 rounded-xl text-sm text-gray-700 hover:bg-white/10 hover:text-indigo-600 transition-colors duration-200"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setIsRankingDropdownOpen(false);
                          }}
                        >
                          • {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
            // Regular mobile menu items
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex px-4 py-3 rounded-2xl text-base font-medium bg-white/10 hover:bg-white/20 hover:text-indigo-600 transition-all duration-300 items-center gap-3 backdrop-blur-sm border border-white/20"
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