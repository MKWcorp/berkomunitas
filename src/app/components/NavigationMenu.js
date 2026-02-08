'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSSOUser } from '@/hooks/useSSOUser';
import { useState, useEffect, useRef } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { loginWithGoogle } from '@/lib/sso';
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
function useLoyaltyPoints() {
  const [points, setPoints] = useState({ loyalty_point: 0, coin: 0 });
  const { isSignedIn } = useSSOUser();

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
  const { isSignedIn } = useSSOUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRankingDropdownOpen, setIsRankingDropdownOpen] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const dropdownRef = useRef(null);
  const loginPopupRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsRankingDropdownOpen(false);
      }
      if (loginPopupRef.current && !loginPopupRef.current.contains(event.target)) {
        setShowLoginPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoginLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential, 'Berkomunitas');
      window.location.reload();
    } catch (err) {
      console.error('Login failed:', err);
      alert('Login gagal. Silakan coba lagi.');
      setLoginLoading(false);
    }
  };

  const handleGoogleError = () => {
    alert('Login dengan Google gagal. Silakan coba lagi.');
  };

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
        { href: '/custom-dashboard/drwcorp', label: 'Sololeveling' },
        { href: '/custom-dashboard/ranking', label: 'Jannawana' }
      ]
    },
    { href: '/tugas', label: 'Tugas', icon: ClipboardDocumentListIcon, signedIn: true },
    { href: '/rewards', label: 'Rewards', icon: GiftIcon, signedIn: true, comingSoon: true },
  ];

  // Filter links for signed-in users only
  const filteredLinks = navLinks.filter(link =>
    (!link.signedIn || isSignedIn)
  );
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
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
                <Link key={link.href} href={link.href} className="px-4 py-2 rounded-2xl text-sm font-medium bg-white/10 hover:bg-white/20 hover:text-indigo-600 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 backdrop-blur-sm border border-white/20 relative">
                  {IconComponent && <IconComponent className="w-4 h-4" />}
                  <span>{link.label}</span>
                  {link.comingSoon && (
                    <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-sm">
                      Coming Soon
                    </span>
                  )}
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
          )}
          
          {!isSignedIn && (
            <div className="relative" ref={loginPopupRef}>
              <button
                onClick={() => setShowLoginPopup(!showLoginPopup)}
                className="bg-white hover:bg-gray-50 px-3 md:px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg backdrop-blur-sm border border-gray-200 text-gray-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Login</span>
              </button>
              {showLoginPopup && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl p-4 border border-gray-200 z-50 min-w-[280px]">
                  <div className="text-center mb-3">
                    <p className="text-sm font-semibold text-gray-700">Login dengan Google</p>
                  </div>
                  {loginLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      theme="outline"
                      size="large"
                      text="signin_with"
                      shape="rectangular"
                      width="100%"
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </nav>{/* Mobile menu */}
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
                <span className="flex-1">{link.label}</span>
                {link.comingSoon && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-sm">
                    Coming Soon
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
    </GoogleOAuthProvider>
  );
}