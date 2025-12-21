'use client';

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { loginWithGoogle, trackActivity, getCurrentUser, logout } from '@/lib/sso';

export default function TestSSOLoginPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const userData = await loginWithGoogle(
        credentialResponse.credential,
        'Berkomunitas'
      );
      
      setUser(userData.user);
      setSuccess('✅ Login berhasil! Token tersimpan di localStorage');
      
      console.log('Login Success:', userData);
    } catch (err) {
      setError(`❌ Login gagal: ${err.message}`);
      console.error('Login Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('❌ Google login dibatalkan atau gagal');
  };

  const handleTrackActivity = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await trackActivity('login', 'Berkomunitas', {
        testActivity: true,
        timestamp: new Date().toISOString(),
      });
      setSuccess('✅ Activity tracked! +1 coin');
    } catch (err) {
      setError(`❌ Track activity gagal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setSuccess('✅ Logged out');
  };

  const checkCurrentUser = () => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setSuccess('✅ User ditemukan di localStorage');
    } else {
      setError('❌ Tidak ada user logged in');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🔐 SSO Login Test Page
            </h1>
            <p className="text-gray-600">
              Test Google OAuth SSO integration untuk Berkomunitas
            </p>
          </div>

          {/* Google Client ID Check */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Configuration Status</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Google Client ID:</span>{' '}
                {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                  <span className="text-green-600">✅ Configured</span>
                ) : (
                  <span className="text-red-600">❌ Not Set (Update .env)</span>
                )}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'NEXT_PUBLIC_GOOGLE_CLIENT_ID not found'}
              </p>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          {/* User Info */}
          {user && (
            <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <h3 className="font-bold text-green-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">👤</span>
                User Info
              </h3>
              <div className="space-y-2">
                {user.photo && (
                  <div className="mb-3">
                    <img 
                      src={user.photo} 
                      alt={user.name}
                      className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
                    />
                  </div>
                )}
                <p><span className="font-semibold">ID:</span> {user.id}</p>
                <p><span className="font-semibold">Name:</span> {user.name}</p>
                <p><span className="font-semibold">Email:</span> {user.email}</p>
                <p><span className="font-semibold">Coin:</span> 🪙 {user.coin}</p>
                <p><span className="font-semibold">Loyalty Points:</span> ⭐ {user.loyaltyPoint}</p>
              </div>
            </div>
          )}

          {/* Login Section */}
          <div className="space-y-4">
            {!user ? (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  1️⃣ Login dengan Google
                </h3>
                <div className="flex flex-col items-center space-y-3">                  {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="filled_blue"
                        size="large"
                        text="signin_with"
                        shape="rectangular"
                        auto_select={false}
                      />
                    </GoogleOAuthProvider>
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                      ⚠️ <strong>Google Client ID belum dikonfigurasi</strong>
                      <p className="text-sm mt-2">
                        Update <code className="bg-yellow-100 px-2 py-1 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> di file .env
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={checkCurrentUser}
                    className="text-blue-600 hover:text-blue-700 text-sm underline"
                  >
                    Atau check user dari localStorage
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 mb-3">
                  2️⃣ Test Features
                </h3>
                
                <button
                  onClick={handleTrackActivity}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : '🎯 Track Activity (Earn +1 Coin)'}
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">📖 Setup Instructions</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Run database migration: <code className="bg-gray-200 px-2 py-1 rounded">python scripts/migrate-sso-tables.py</code></li>
              <li>Setup Google OAuth di Google Cloud Console</li>
              <li>Update <code className="bg-gray-200 px-2 py-1 rounded">.env</code> dengan Google Client ID</li>
              <li>Restart dev server: <code className="bg-gray-200 px-2 py-1 rounded">npm run dev</code></li>
              <li>Test login di halaman ini!</li>
            </ol>
            <p className="mt-3 text-xs text-gray-500">
              Full guide: <code className="bg-gray-200 px-1 rounded">SSO_SETUP_README.md</code>
            </p>
          </div>

          {/* LocalStorage Debug */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">🔍 Debug Info</h3>
            <div className="space-y-2 text-xs font-mono">
              <p>
                <span className="text-gray-600">Access Token:</span>{' '}
                {typeof window !== 'undefined' && localStorage.getItem('access_token') ? (
                  <span className="text-green-600">✅ Present</span>
                ) : (
                  <span className="text-red-600">❌ None</span>
                )}
              </p>
              <p>
                <span className="text-gray-600">Refresh Token:</span>{' '}
                {typeof window !== 'undefined' && localStorage.getItem('refresh_token') ? (
                  <span className="text-green-600">✅ Present</span>
                ) : (
                  <span className="text-red-600">❌ None</span>
                )}
              </p>
              <p>
                <span className="text-gray-600">User Data:</span>{' '}
                {typeof window !== 'undefined' && localStorage.getItem('user') ? (
                  <span className="text-green-600">✅ Present</span>
                ) : (
                  <span className="text-red-600">❌ None</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* API Test Card */}
        <div className="mt-6 bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🧪 API Endpoints</h2>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-50 rounded">
              <p className="font-semibold text-blue-900">POST /api/sso/google-login</p>
              <p className="text-gray-600">Google OAuth login endpoint</p>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <p className="font-semibold text-green-900">POST /api/sso/verify-token</p>
              <p className="text-gray-600">Verify JWT access token</p>
            </div>
            <div className="p-3 bg-purple-50 rounded">
              <p className="font-semibold text-purple-900">POST /api/sso/refresh-token</p>
              <p className="text-gray-600">Refresh expired access token</p>
            </div>
            <div className="p-3 bg-orange-50 rounded">
              <p className="font-semibold text-orange-900">POST /api/sso/track-activity</p>
              <p className="text-gray-600">Track user activity (earn coins!)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
