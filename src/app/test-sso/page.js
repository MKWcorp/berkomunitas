/**
 * SSO Login Test Page
 * Test Google Login with SSO
 */
'use client';

import { useState, useEffect } from 'react';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import { getCurrentUser, getVerifiedUser, logout, isLoggedIn } from '@/lib/sso';

export default function SSOTestPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginStatus, setLoginStatus] = useState('');

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    setLoading(true);
    try {
      if (isLoggedIn()) {
        const verifiedUser = await getVerifiedUser();
        setUser(verifiedUser);
        setLoginStatus('Logged in');
      } else {
        setLoginStatus('Not logged in');
      }
    } catch (error) {
      console.error('Error checking login status:', error);
      setLoginStatus('Error checking status');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (result) => {
    console.log('Login successful!', result);
    setUser(result.user);
    setLoginStatus('Login successful!');
  };

  const handleLoginError = (error) => {
    console.error('Login error:', error);
    setLoginStatus(`Login failed: ${error.message}`);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setLoginStatus('Logged out');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking login status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">🔐 SSO Login Test</h1>
            <p className="text-blue-100 mt-2">Universal Google Login untuk semua platform DRW</p>
          </div>

          <div className="p-8">
            {/* Status Badge */}
            <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-sm font-medium text-gray-600">Status:</p>
              <p className={`text-lg font-bold ${user ? 'text-green-600' : 'text-gray-800'}`}>
                {loginStatus}
              </p>
            </div>

            {user ? (
              // Logged In View
              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-6 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex-shrink-0">
                    {user.photo ? (
                      <img
                        src={user.photo}
                        alt={user.name}
                        className="w-16 h-16 rounded-full"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl font-bold">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-600">
                      {user.coin || 0} 🪙
                    </div>
                    <p className="text-sm text-gray-500">Coin</p>
                  </div>
                </div>

                {/* User Details */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">User Details</h3>
                  <div className="space-y-3">
                    <DetailRow label="ID" value={user.id} />
                    <DetailRow label="Email" value={user.email} />
                    <DetailRow label="Google ID" value={user.googleId} />
                    <DetailRow label="Coin" value={user.coin || 0} />
                    <DetailRow label="Loyalty Points" value={user.loyaltyPoint || 0} />
                    <DetailRow 
                      label="Admin" 
                      value={user.isAdmin ? '✅ Yes' : '❌ No'} 
                    />
                    <DetailRow 
                      label="Last Login" 
                      value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'N/A'} 
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    onClick={handleLogout}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                  <button
                    onClick={checkLoginStatus}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Refresh Status
                  </button>
                </div>
              </div>
            ) : (
              // Login View
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome to Berkomunitas
                  </h2>
                  <p className="text-gray-600">
                    Login dengan Google untuk akses ke semua platform DRW
                  </p>
                </div>

                <div className="flex flex-col items-center space-y-4">
                  <GoogleLoginButton
                    onSuccess={handleLoginSuccess}
                    onError={handleLoginError}
                    platform="Berkomunitas"
                    className="w-full max-w-sm"
                  />
                </div>

                <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-3">✨ Keuntungan SSO:</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>✅ Login sekali untuk semua platform (DRW Skincare, DRW Prime, Beauty Center, POS)</li>
                    <li>✅ Point terakumulasi dari semua aktivitas</li>
                    <li>✅ Data tersinkronisasi otomatis</li>
                    <li>✅ Keamanan terjamin dengan Google OAuth</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-6 p-4 bg-gray-800 text-white rounded-lg text-xs font-mono">
          <h4 className="font-semibold mb-2">🔧 Debug Info:</h4>
          <pre className="overflow-x-auto">
            {JSON.stringify({
              isLoggedIn: isLoggedIn(),
              hasUser: !!user,
              loginStatus,
              timestamp: new Date().toISOString(),
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-200">
      <span className="text-gray-600 font-medium">{label}:</span>
      <span className="text-gray-900 font-semibold">{value}</span>
    </div>
  );
}
