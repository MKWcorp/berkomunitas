'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import GlassCard from './components/GlassCard';
import { isLoggedIn, getCurrentUser } from '@/lib/sso';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    if (isLoggedIn()) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      {/* Full Screen Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/landing-background.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full h-full grid grid-cols-1 lg:grid-cols-2">
        
        {/* Left Side - Content */}
        <div className="flex items-center justify-center p-6 lg:p-12 col-span-1">
          <div className="w-full max-w-lg text-center lg:text-left">
            {/* Logo Section */}
            <div className="mb-8">
              <div className="w-24 h-24 mb-6 mx-auto lg:mx-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Image
                  src="/logo-b.png"
                  alt="Berkomunitas Logo"
                  width={60}
                  height={60}
                  className="rounded-full"
                />
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 leading-tight text-white drop-shadow-lg">
              Gabung Komunitas,
              <br />
              <span className="text-yellow-300">
                Raih Poin Loyalitas
              </span>
            </h1>            {/* Sub-headline */}
            <p className="text-base md:text-lg lg:text-xl text-white/90 mb-8 leading-relaxed drop-shadow-md max-w-md mx-auto lg:mx-0">
              Dapatkan poin loyalitas dengan mengerjakan tugas-tugas seru.
              Tukarkan poinmu dengan berbagai hadiah menarik.
            </p>

            {/* CTA Buttons with Glass Effect */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center lg:justify-start">
              {loading ? (
                <div className="px-8 py-3 bg-white/20 backdrop-blur-md rounded-full text-white">
                  Loading...
                </div>
              ) : user ? (
                <Link 
                  href="/profil"
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-md text-center"
                >
                  Dashboard ({user.nama_lengkap || 'User'})
                </Link>
              ) : null}
            </div>

            {/* Version Info */}
            <div className="pt-6">
              <p className="text-sm text-white/70 drop-shadow">
                berkomunitas.com - v2.0
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Community Hand Image (Hidden on Mobile) */}
        <div className="hidden lg:flex relative items-center justify-center lg:justify-end col-span-1">
          <div className="relative w-full h-full">
            <Image
              src="/tangan-komunitas.png"
              alt="Komunitas Hands"
              fill
              className="object-contain object-right drop-shadow-2xl"
              priority
            />
          </div>
        </div>

      </div>
    </div>
  );
}