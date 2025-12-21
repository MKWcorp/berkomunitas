/**
 * Google Login Button Component with SSO
 * Universal login for all DRW platforms
 */
'use client';

import { useState } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { loginWithGoogle, trackActivity } from '@/lib/sso';

export default function GoogleLoginButton({ 
  onSuccess, 
  onError,
  platform = 'Berkomunitas',
  redirectTo = '/dashboard',
  className = ''
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await loginWithGoogle(
        credentialResponse.credential,
        platform
      );

      console.log('Login successful:', result.user);

      // Track login activity
      await trackActivity('login', platform, {
        loginTime: new Date().toISOString(),
      });

      // Call custom onSuccess handler if provided
      if (onSuccess) {
        onSuccess(result);
      } else {
        // Default: redirect to dashboard
        window.location.href = redirectTo;
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = () => {
    const errorMsg = 'Google login failed. Please try again.';
    setError(errorMsg);
    console.error(errorMsg);
    
    if (onError) {
      onError(new Error(errorMsg));
    }
  };

  return (
    <div className={`google-login-wrapper ${className}`}>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
        {isLoading ? (
          <div className="flex items-center justify-center p-4 bg-white border border-gray-300 rounded-md shadow-sm">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-gray-700">Logging in...</span>
          </div>
        ) : (
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap={false}
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
          />
        )}
      </GoogleOAuthProvider>

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Simple usage example:
 * 
 * import GoogleLoginButton from '@/components/GoogleLoginButton';
 * 
 * <GoogleLoginButton 
 *   onSuccess={(result) => {
 *     console.log('User logged in:', result.user);
 *   }}
 *   platform="Berkomunitas"
 * />
 */
