'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, SignInButton } from '@clerk/nextjs';
import { GlassContainer } from '@/components/GlassLayout';

export default function AdminRootPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [checking, setChecking] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // Debug state changes
  useEffect(() => {
    const debug = `isLoaded: ${isLoaded}, user: ${!!user}, adminCheckDone: ${adminCheckDone}, checking: ${checking}, isAdmin: ${isAdmin}`;
    setDebugInfo(debug);
    console.log('🔍 Admin Page State:', debug);
  }, [isLoaded, user, adminCheckDone, checking, isAdmin]);

  useEffect(() => {
    // Only run once when user data is loaded
    if (!isLoaded || adminCheckDone) return;
    
    // If no user is signed in, don't proceed with admin check
    if (!user?.primaryEmailAddress?.emailAddress) {
      console.log('✅ No authenticated user, showing login page');
      setAdminCheckDone(true);
      return; // Stay on this page to show login button
    }

    console.log('🔐 User authenticated, checking admin privileges...');
    setChecking(true);
    
    // Check admin privileges using debug API
    fetch('/api/debug/admin', {
      method: 'GET',
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      console.log('Debug admin response:', data);
      
      if (data.success && data.isAdmin) {
        setIsAdmin(true);
        setAdminCheckDone(true);
        
        // Check if we're on admin subdomain or main domain
        const isSubdomain = window.location.hostname === 'admin.berkomunitas.com';
        
        if (isSubdomain) {
          // On subdomain, navigate to relative /dashboard (middleware will handle rewrite)
          router.push('/dashboard');
        } else {
          // On main domain, navigate to full /admin-app/dashboard
          router.push('/admin-app/dashboard');
        }
      } else {
        // Not admin or error - show debug info
        console.log('Admin access denied:', data);
        setIsAdmin(false);
        setAdminCheckDone(true);
        setChecking(false);
      }
    })
    .catch(error => {
      console.error('Admin check error:', error);
      setIsAdmin(false);
      setAdminCheckDone(true);
      setChecking(false);
    });
  }, [isLoaded, user?.id, adminCheckDone, router]); // Better dependency array

  // Show loading while checking authentication - only show if we haven't completed admin check
  if (!isLoaded || (checking && !adminCheckDone)) {
    console.log('📱 Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassContainer className="p-8 text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {!isLoaded ? 'Memuat aplikasi...' : 'Memeriksa akses admin...'}
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
        </GlassContainer>
      </div>
    );
  }

  // Show login button if not authenticated and check is done
  if (adminCheckDone && !user?.primaryEmailAddress?.emailAddress) {
    console.log('🔐 Showing login page');
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassContainer className="p-12 text-center max-w-md">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Admin Panel</h1>
            <p className="text-gray-600 mb-4">
              Selamat datang di panel administrasi berkomunitas.com
            </p>
            <p className="text-sm text-blue-600 mb-8">
              Silakan login untuk mengakses dashboard admin
            </p>
          </div>
          
          <div className="space-y-4">
            <SignInButton mode="modal" redirectUrl="/admin-app">
              <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-4 px-8 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg">
                🔐 Login Admin
              </button>
            </SignInButton>
            
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
              onClick={() => window.location.href = 'https://berkomunitas.com/sign-in'}
              className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-8 rounded-xl hover:bg-gray-200 transition-all duration-300 border border-gray-300"
            >
              Login di Main Site
            </button>
          </div>
          
          <div className="mt-8 space-y-2">
            <div className="text-sm text-gray-500">
              Hanya untuk administrator yang terotorisasi
            </div>
            <div className="text-xs text-gray-400">
              Domain: {typeof window !== 'undefined' ? window.location.hostname : 'admin.berkomunitas.com'}
            </div>
            <div className="text-xs text-red-500 font-mono">
              Debug: {debugInfo}
            </div>
          </div>
        </GlassContainer>
      </div>
    );
  }

  // Show error if user is authenticated but not admin and check is done
  if (adminCheckDone && user?.primaryEmailAddress?.emailAddress && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassContainer className="p-8 text-center max-w-lg">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Akses Admin Ditolak</h1>
          <div className="text-left mb-6 space-y-2">
            <p className="text-gray-600 mb-4">
              Akun Anda tidak memiliki izin administrator untuk mengakses panel ini.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg text-sm">
              <h3 className="font-bold text-blue-800 mb-2">📋 Info Debug:</h3>
              <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
              <p><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress || 'N/A'}</p>
              <p><strong>Expected Admin:</strong> drwcorpora@gmail.com (User ID 224)</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-sm mt-4">
              <h3 className="font-bold text-yellow-800 mb-2">💡 Troubleshooting:</h3>
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                <li>Pastikan login dengan email yang benar</li>
                <li>Logout dan login kembali jika perlu</li>
                <li>Hubungi administrator sistem</li>
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
            <button 
              onClick={() => window.location.href = '/api/debug/admin'}
              className="w-full bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-600 transition-all duration-300"
            >
              Debug API Admin
            </button>
          </div>
        </GlassContainer>
      </div>
    );
  }
  
  // Default fallback - shouldn't reach here normally
  console.log('⚠️ Reached fallback state - this should not happen normally');
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ Debug Mode</h1>
        <div className="text-left space-y-2 text-sm">
          <p><strong>Debug Info:</strong> {debugInfo}</p>
          <p><strong>isLoaded:</strong> {isLoaded ? 'Yes' : 'No'}</p>
          <p><strong>User:</strong> {user?.primaryEmailAddress?.emailAddress || 'None'}</p>
          <p><strong>adminCheckDone:</strong> {adminCheckDone ? 'Yes' : 'No'}</p>
          <p><strong>checking:</strong> {checking ? 'Yes' : 'No'}</p>
          <p><strong>isAdmin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
          <p><strong>Timestamp:</strong> {new Date().toLocaleTimeString()}</p>
        </div>
        <button 
          onClick={() => {
            setAdminCheckDone(false);
            setChecking(false);
            setIsAdmin(false);
          }}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Reset State
        </button>
        <div className="mt-4 p-4 bg-yellow-100 rounded text-xs">
          <p><strong>Kemungkinan masalah:</strong></p>
          <ul className="list-disc list-inside text-left mt-2">
            <li>Clerk authentication belum ready</li>
            <li>GlassCard component tidak ditemukan</li>
            <li>CSS/Tailwind tidak ter-load</li>
            <li>JavaScript error di console</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
