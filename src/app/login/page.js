/**
 * Login Page with Google SSO
 * Replace Clerk login with Google OAuth
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { loginWithGoogle, isLoggedIn } from '@/lib/sso';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [returnUrl, setReturnUrl] = useState('/');
  const [checkingAuth, setCheckingAuth] = useState(true);  useEffect(() => {
    // Get return URL from query params
    const params = new URLSearchParams(window.location.search);
    const url = params.get('returnUrl') || '/';
    setReturnUrl(url);

    // Check if user is logged in with valid token
    const checkAuth = async () => {
      if (isLoggedIn()) {
        try {
          // Verify token is still valid
          const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
          const response = await fetch('/api/sso/verify-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });

          if (response.ok) {
            console.log('[Login Page] Valid token found, redirecting to:', url);
            window.location.href = url;
          } else {
            // Token invalid, clear it
            console.log('[Login Page] Invalid token, clearing...');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('sso_user');
            setCheckingAuth(false);
          }
        } catch (error) {
          console.error('[Login Page] Token verification failed:', error);
          // Clear invalid tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('sso_user');
          setCheckingAuth(false);
        }
      } else {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memeriksa status login...</p>
        </div>
      </div>
    );
  }
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError(null);

    try {
      const result = await loginWithGoogle(
        credentialResponse.credential,
        'Berkomunitas'
      );
      
      console.log('✅ Login successful:', result.user);
      
      // Use window.location for reliable redirect after login
      console.log('[Login Page] Redirecting to:', returnUrl);
      window.location.href = returnUrl;
    } catch (err) {
      console.error('❌ Login failed:', err);
      setError(err.message || 'Login gagal. Silakan coba lagi.');
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Login dengan Google gagal. Silakan coba lagi.');
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <img 
                src="/logo-b.png" 
                alt="Berkomunitas" 
                className="h-16 mx-auto"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Selamat Datang
            </h1>
            <p className="text-gray-600">
              Login ke Berkomunitas dengan akun Google Anda
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Google Login Button */}
          <div className="space-y-4">
            <div className="flex justify-center">
              {loading ? (
                <div className="w-full py-3 px-4 bg-gray-100 rounded-lg text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 text-sm mt-2">Sedang login...</p>
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                  logo_alignment="left"
                  width="100%"
                />
              )}
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg 
                  className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-blue-900 text-sm mb-1">
                    Untuk User Lama (Clerk)
                  </h3>
                  <p className="text-blue-800 text-xs leading-relaxed">
                    Jika Anda sudah punya akun sebelumnya, gunakan email yang sama 
                    saat login dengan Google. Data Anda (coin, loyalty point, dll) 
                    akan otomatis tersinkronisasi.
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="mt-6 space-y-3">
              <p className="text-sm font-semibold text-gray-700">Keuntungan login:</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>🎁 Dapatkan <strong>1 coin</strong> bonus setiap login</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>💎 Kumpulkan loyalty point untuk reward eksklusif</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>🔒 Akses aman dengan Google OAuth</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>🌐 Satu akun untuk semua platform DRW</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Dengan login, Anda menyetujui{' '}
              <a href="/terms" className="text-blue-600 hover:underline">
                Syarat & Ketentuan
              </a>{' '}
              dan{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Kebijakan Privasi
              </a>
            </p>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
