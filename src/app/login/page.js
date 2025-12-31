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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Login
            </h1>
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
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
