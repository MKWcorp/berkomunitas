'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isLoggedIn, getCurrentUser } from '@/lib/sso';

export default function UserDashboardButton() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn()) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="px-8 py-3 bg-white/20 backdrop-blur-md rounded-full text-white">
        Loading...
      </div>
    );
  }

  if (user) {
    return (
      <Link 
        href="/profil"
        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-md text-center"
      >
        Dashboard ({user.nama_lengkap || 'User'})
      </Link>
    );
  }

  return (
    <div className="flex gap-4">
        <Link 
            href="/auth/login"
            className="px-8 py-3 bg-white text-blue-600 hover:bg-gray-100 rounded-full font-bold shadow-lg transition-all duration-300"
        >
            Masuk
        </Link>
        <Link
            href="/auth/register"
            className="hidden sm:inline-block px-8 py-3 border-2 border-white/50 text-white hover:bg-white/10 rounded-full font-semibold transition-all duration-300 backdrop-blur-sm"
        >
            Daftar
        </Link>
    </div>
  );
}
