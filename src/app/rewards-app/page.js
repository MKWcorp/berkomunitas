'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSSOUser } from '@/hooks/useSSOUser';
import GlassCard from './components/GlassCard';

export default function RewardsRootPage() {
  const router = useRouter();
  const { user, isLoaded } = useSSOUser();
  const [checking, setChecking] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const [isPartnerOrAbove, setIsPartnerOrAbove] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // Debug state changes
  useEffect(() => {
    const debug = `isLoaded: ${isLoaded}, user: ${!!user}, adminCheckDone: ${adminCheckDone}, checking: ${checking}, isPartnerOrAbove: ${isPartnerOrAbove}`;
    setDebugInfo(debug);
    console.log('🏆 Rewards Page State:', debug);
  }, [isLoaded, user, adminCheckDone, checking, isPartnerOrAbove]);

  useEffect(() => {
    // Only run once when user data is loaded
    if (!isLoaded || adminCheckDone) return;
    
    // If no user is signed in, don't proceed with admin check
    if (!user?.email) {
      console.log('✅ No authenticated user, showing login page');
      setAdminCheckDone(true);
      return; // Stay on this page to show login button
    }

    console.log('🔐 User authenticated, checking partner privileges...');
    setChecking(true);
    
    // Check privileges using user-privileges API (doesn't require admin)
    fetch('/api/user-privileges')
    .then(res => res.json())
    .then(data => {
      console.log('User privileges response:', data);
      
      // Check if user has partner or admin privileges
      const hasAccess = data.success && (
        data.privileges.includes('admin') || 
        data.privileges.includes('partner')
      );
      
      if (hasAccess) {
        setIsPartnerOrAbove(true);
        setAdminCheckDone(true);
        
        // Check if we're on rewards subdomain or main domain
        const isSubdomain = window.location.hostname === 'rewards.berkomunitas.com';
        
        if (isSubdomain) {
          // On subdomain, navigate to relative /dashboard (middleware will handle rewrite)
          router.push('/dashboard');
        } else {
          // On main domain, navigate to full /rewards-app/dashboard
          router.push('/rewards-app/dashboard');
        }
      } else {
        // Not partner/admin - show access denied
        console.log('Rewards access denied:', data);
        setIsPartnerOrAbove(false);
        setAdminCheckDone(true);
        setChecking(false);
      }
    })
    .catch(error => {
      console.error('Privilege check error:', error);
      setIsPartnerOrAbove(false);
      setAdminCheckDone(true);
      setChecking(false);
    });
  }, [isLoaded, user?.id, adminCheckDone, router]);

  // Show loading while checking authentication
  if (!isLoaded || (checking && !adminCheckDone)) {
    console.log('📱 Showing loading state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <GlassCard className="p-8 text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {!isLoaded ? 'Memuat aplikasi...' : 'Memeriksa akses rewards...'}
            </h2>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
            </div>
            <div className="mt-6 text-sm text-gray-500">
              Mohon tunggu sebentar
            </div>
            <div className="mt-4 text-xs text-gray-400 font-mono">
              Debug: {debugInfo}
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Show login button if not authenticated and check is done
  if (adminCheckDone && !user?.email) {
    console.log('🔐 Showing login page');
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <GlassCard className="p-12 text-center max-w-md">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 0v6M9 21h6" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">🎁 Rewards Panel</h1>
            <p className="text-gray-600 mb-4">
              Selamat datang di panel manajemen rewards berkomunitas.com
            </p>
            <p className="text-sm text-green-600 mb-8">
              Silakan login untuk mengakses sistem rewards
            </p>
          </div>
            <div className="space-y-4">
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-4 px-8 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg"
            >
              🔐 Login dengan Google
            </button>
            
            {/* Alternative login method */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">atau</span>
              </div>
            </div>
            
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-8 rounded-xl hover:bg-gray-200 transition-all duration-300 border border-gray-300"
            >
              Kembali ke Beranda
            </button>
          </div>
          
          <div className="mt-8 space-y-2">
            <div className="text-sm text-gray-500">
              Untuk partner dan administrator yang terotorisasi
            </div>
            <div className="text-xs text-gray-400">
              Domain: {typeof window !== 'undefined' ? window.location.hostname : 'rewards.berkomunitas.com'}
            </div>
            <div className="text-xs text-green-500 font-mono">
              Debug: {debugInfo}
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Show error if user is authenticated but not partner/admin
  if (adminCheckDone && user?.email && !isPartnerOrAbove) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <GlassCard className="p-8 text-center max-w-lg">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Akses Rewards Ditolak</h1>
          <div className="text-left mb-6 space-y-2">
            <p className="text-gray-600 mb-4">
              Akun Anda tidak memiliki izin partner/admin untuk mengakses panel rewards ini.
            </p>
            <div className="bg-green-50 p-4 rounded-lg text-sm">
              <h3 className="font-bold text-green-800 mb-2">🎁 Info Akses:</h3>
              <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
              <p><strong>Minimum Level:</strong> Partner atau Admin</p>
              <p><strong>Panel:</strong> Rewards Management System</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-sm mt-4">
              <h3 className="font-bold text-yellow-800 mb-2">💡 Cara Mendapatkan Akses:</h3>
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                <li>Upgrade level menjadi partner atau admin</li>
                <li>Hubungi administrator sistem</li>
                <li>Pastikan privilege sudah aktif</li>
              </ul>
            </div>
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/')}
              className="w-full bg-gray-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-600 transition-all duration-300"
            >
              Kembali ke Beranda
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }
  
  // Default fallback
  console.log('⚠️ Reached fallback state - this should not happen normally');
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ Debug Mode - Rewards</h1>
        <div className="text-left space-y-2 text-sm">
          <p><strong>Debug Info:</strong> {debugInfo}</p>
          <p><strong>isLoaded:</strong> {isLoaded ? 'Yes' : 'No'}</p>
          <p><strong>User:</strong> {user?.email || 'None'}</p>
          <p><strong>adminCheckDone:</strong> {adminCheckDone ? 'Yes' : 'No'}</p>
          <p><strong>checking:</strong> {checking ? 'Yes' : 'No'}</p>
          <p><strong>isPartnerOrAbove:</strong> {isPartnerOrAbove ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
}