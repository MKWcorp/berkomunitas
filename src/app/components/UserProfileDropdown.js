'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useClerk, UserProfile } from '@clerk/nextjs';
import { 
  UserCircleIcon, 
  BookOpenIcon, 
  QuestionMarkCircleIcon, 
  ShieldCheckIcon, 
  ArrowRightOnRectangleIcon,
  CogIcon,
  XMarkIcon,
  StarIcon
} from '@heroicons/react/24/outline';

export default function UserProfileDropdown() {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const [showClerkUI, setShowClerkUI] = useState(false);
  // Fetch foto_profil_url from dashboard
  const [fotoProfilUrl, setFotoProfilUrl] = useState(null);
  // Fetch user privileges
  const [userPrivileges, setUserPrivileges] = useState([]);
  useEffect(() => {
    async function fetchFotoProfil() {
      try {
        const res = await fetch('/api/profil/dashboard', { credentials: 'include' });
        const data = await res.json();
        if (res.ok && data.success) {
          if (data.data?.member?.foto_profil_url) {
            setFotoProfilUrl(data.data.member.foto_profil_url);
          }
          // Fetch user privileges
          if (data.data?.privileges) {
            setUserPrivileges(data.data.privileges);
          }
        }
      } catch {}
    }
    if (isSignedIn) fetchFotoProfil();
  }, [isSignedIn]);
  const dropdownRef = useRef(null);

  // TODO: fetch data user jika perlu

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ...hapus fetchProfileData

  const handleSignOut = () => {
    signOut();
    setIsOpen(false);
  };

  const handleOpenSettings = () => {
    setShowClerkUI(true);
    setIsOpen(false);
  };

  const handleCloseSettings = () => {
    setShowClerkUI(false);
  };

  const getProfileImage = () => {
    // Priority: fotoProfilUrl (from DB) -> Clerk imageUrl -> Default avatar
    if (fotoProfilUrl) return fotoProfilUrl;
    if (user?.imageUrl) return user.imageUrl;
    return '/logo-b.png';
  };

  const getDisplayName = () => {
    return user?.fullName || user?.firstName || 'User';
  };

  // Get user's highest privilege
  const getHighestPrivilege = () => {
    if (!userPrivileges || userPrivileges.length === 0) return 'user';
    
    const privilegeHierarchy = { 'user': 1, 'berkomunitasplus': 2, 'partner': 3, 'admin': 4 };
    let highest = 'user';
    let highestLevel = 0;
    
    userPrivileges.forEach(p => {
      const level = privilegeHierarchy[p.privilege] || 0;
      if (level > highestLevel) {
        highest = p.privilege;
        highestLevel = level;
      }
    });
    
    return highest;
  };

  // Get BerkomunitasPlus URL based on user privilege
  const getBerkomunitasPlusHref = () => {
    const userCurrentPrivilege = getHighestPrivilege();
    return userCurrentPrivilege === 'berkomunitasplus' ? '/plus/verified' : '/plus';
  };

  if (!isSignedIn) {
    return null;
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
      {/* Profile Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="relative w-8 h-8 md:w-10 md:h-10">
          <Image
            src={getProfileImage()}
            alt="Profile"
            width={40}
            height={40}
            className="w-full h-full rounded-full object-cover border-2 border-gray-600"
            unoptimized={false}
          />
          {/* Online indicator */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white/90 backdrop-blur border border-white/20 rounded-2xl shadow-2xl z-50 py-2">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12">
                <Image
                  src={getProfileImage()}
                  alt="Profile"
                  width={48}
                  height={48}
                  className="w-full h-full rounded-full object-cover"
                  unoptimized={user?.imageUrl?.startsWith('http')}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/profil"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-800 hover:bg-white/40 rounded-xl transition-colors"
            >
              <UserCircleIcon className="w-5 h-5 mr-3 text-blue-500" />
              Profil Saya
            </Link>

            <Link
              href={getBerkomunitasPlusHref()}
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-800 hover:bg-white/40 rounded-xl transition-colors"
            >
              <StarIcon className="w-5 h-5 mr-3 text-yellow-500" />
              BerkomunitasPlus
            </Link>

            <button
              onClick={handleOpenSettings}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-800 hover:bg-white/40 rounded-xl transition-colors"
            >
              <CogIcon className="w-5 h-5 mr-3 text-orange-500" />
              Pengaturan
            </button>

            <Link
              href="/faq"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-800 hover:bg-white/40 rounded-xl transition-colors"
            >
              <QuestionMarkCircleIcon className="w-5 h-5 mr-3 text-purple-500" />
              FAQ
            </Link>            <Link
              href="/user-guide"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-800 hover:bg-white/40 rounded-xl transition-colors"
            >
              <BookOpenIcon className="w-5 h-5 mr-3 text-green-500" />
              User Guide
            </Link>

            <Link
              href="/privacy-policy"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-800 hover:bg-white/40 rounded-xl transition-colors"
            >
              <ShieldCheckIcon className="w-5 h-5 mr-3 text-indigo-500" />
              Privacy Policy
            </Link>

            <div className="border-t border-white/30 my-2"></div>

            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-100/40 rounded-xl transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3 text-red-500" />
              Sign Out
            </button>
          </div>
        </div>
      )}
      </div>

      {/* Clerk Settings Modal */}
      {showClerkUI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden relative mx-auto my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CogIcon className="w-5 h-5 text-orange-500" />
                Pengaturan Akun
              </h3>
              <button
                onClick={handleCloseSettings}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Clerk UserProfile Component */}
            <div className="overflow-auto max-h-[calc(85vh-80px)] p-2">
              <UserProfile 
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-0 w-full",
                    header: "hidden",
                    navbar: "border-r border-gray-200",
                    pageScrollBox: "p-4",
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
