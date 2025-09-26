'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  BoltIcon, 
  TrophyIcon, 
  GiftIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  StarIcon,
  ArrowRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../components/GlassCard';

export default function LandingPage() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center p-6">
        {/* Background Video with Glass Overlay */}
        <div className="absolute inset-0 z-0">
          <video
            className="w-full h-full object-cover opacity-30"
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => setIsVideoLoaded(true)}
          >
            <source src="/video-komunitas2.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <GlassCard className="mb-8">
            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight transition-opacity duration-1000 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Bangun Komunitas Anda,
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Raih Loyalitas Sejati.
              </span>
            </h1>
            
            <p className={`text-lg sm:text-xl lg:text-2xl mb-8 text-gray-700 max-w-3xl mx-auto leading-relaxed transition-opacity duration-1000 delay-300 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}>
              Bergabunglah dengan platform inovatif untuk membangun komunitas yang engaged dan loyal melalui sistem reward yang menarik.
            </p>

            {/* CTA Button */}
            <Link 
              href="/sign-up"
              className={`inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 transition-opacity duration-1000 delay-500 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
            >
              <UserGroupIcon className="w-5 h-5" />
              Daftar Sekarang
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </GlassCard>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-blue-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-blue-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <GlassCard className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Fitur Unggulan
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Solusi lengkap untuk membangun komunitas yang engaged dan loyal
            </p>
          </GlassCard>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Otomatisasi Cerdas */}
            <GlassCard className="text-center group hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center group-hover:shadow-lg group-hover:shadow-blue-500/25">
                <BoltIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Otomatisasi Cerdas</h3>
              <p className="text-gray-600 leading-relaxed">
                Sistem berjalan otomatis, mulai dari validasi tugas hingga pemberian poin.
              </p>
            </GlassCard>

            {/* Feature 2: Gamifikasi Menarik */}
            <GlassCard className="text-center group hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:shadow-lg group-hover:shadow-purple-500/25">
                <TrophyIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Gamifikasi Menarik</h3>
              <p className="text-gray-600 leading-relaxed">
                Tingkatkan engagement dengan level, lencana, dan papan peringkat.
              </p>
            </GlassCard>

            {/* Feature 3: Hadiah Nyata */}
            <GlassCard className="text-center group hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center group-hover:shadow-lg group-hover:shadow-green-500/25">
                <GiftIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Hadiah Nyata</h3>
              <p className="text-gray-600 leading-relaxed">
                Tukarkan poin yang terkumpul dengan hadiah eksklusif.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <GlassCard>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="group">
                <div className="flex items-center justify-center mb-3">
                  <UserGroupIcon className="w-8 h-8 text-blue-500 mr-2" />
                  <div className="text-4xl font-bold text-blue-600">1000+</div>
                </div>
                <div className="text-gray-700 font-medium">Member Aktif</div>
              </div>
              <div className="group">
                <div className="flex items-center justify-center mb-3">
                  <ChartBarIcon className="w-8 h-8 text-green-500 mr-2" />
                  <div className="text-4xl font-bold text-green-600">50K+</div>
                </div>
                <div className="text-gray-700 font-medium">Poin Terdistribusi</div>
              </div>
              <div className="group">
                <div className="flex items-center justify-center mb-3">
                  <StarIcon className="w-8 h-8 text-purple-500 mr-2" />
                  <div className="text-4xl font-bold text-purple-600">95%</div>
                </div>
                <div className="text-gray-700 font-medium">Kepuasan User</div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <GlassCard className="text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Siap Membangun Komunitas Impian Anda?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Bergabunglah dengan ribuan komunitas yang telah merasakan transformasi digital
            </p>
            <Link 
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
            >
              <PlayIcon className="w-5 h-5" />
              Mulai Gratis Sekarang
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <GlassCard variant="subtle" className="text-center">
            <p className="text-gray-600">&copy; 2025 Berkomunitas v1.0. All rights reserved.</p>
          </GlassCard>
        </div>
      </footer>
    </div>
  );
}