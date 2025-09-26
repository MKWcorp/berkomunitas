'use client';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function AdminSubdomainTest() {
  const { user, isLoaded } = useUser();
  const [info, setInfo] = useState({});
  const [apiTest, setApiTest] = useState(null);

  useEffect(() => {
    setInfo({
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      url: window.location.href,
      origin: window.location.origin,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    // Test API access
    fetch('/api/debug/admin')
      .then(res => res.json())
      .then(data => {
        setApiTest({ success: true, data });
      })
      .catch(error => {
        setApiTest({ success: false, error: error.message });
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Admin Subdomain Debug</h1>
        
        {/* Route Detection */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">🌐 Route Detection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold mb-2">Current Access:</h3>
              <div className="bg-blue-100 p-4 rounded">
                {info.hostname === 'admin.berkomunitas.com' ? (
                  <div className="text-blue-800">
                    ✅ <strong>Subdomain Access</strong><br/>
                    Domain: admin.berkomunitas.com<br/>
                    Expected: Middleware should rewrite to /admin-app
                  </div>
                ) : info.hostname === 'berkomunitas.com' && info.pathname?.startsWith('/admin-app') ? (
                  <div className="text-green-800">
                    ✅ <strong>Direct Access</strong><br/>
                    Path: /admin-app/*<br/>
                    Expected: Direct access to admin app
                  </div>
                ) : (
                  <div className="text-red-800">
                    ❓ <strong>Unexpected Access</strong><br/>
                    Host: {info.hostname}<br/>
                    Path: {info.pathname}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">Expected Behavior:</h3>
              <div className="bg-gray-100 p-4 rounded text-sm">
                <p><strong>admin.berkomunitas.com/</strong><br/>
                → Should show same content as<br/>
                <strong>berkomunitas.com/admin-app/</strong></p>
                <p className="mt-2"><strong>Both should show:</strong><br/>
                - Login button if not authenticated<br/>
                - Admin dashboard if authenticated admin<br/>
                - Access denied if authenticated non-admin</p>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Info */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">🌐 Connection Details</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
{JSON.stringify(info, null, 2)}
          </pre>
        </div>

        {/* Auth Status */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">👤 Authentication Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold mb-2">Clerk Auth:</h3>
              <div className="space-y-2">
                <p><strong>Clerk Loaded:</strong> {isLoaded ? '✅ Yes' : '❌ No'}</p>
                <p><strong>User Exists:</strong> {user ? '✅ Yes' : '❌ No'}</p>
                {user && (
                  <>
                    <p><strong>User ID:</strong> {user.id}</p>
                    <p><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}</p>
                    <p><strong>First Name:</strong> {user.firstName}</p>
                    <p><strong>Last Name:</strong> {user.lastName}</p>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">API Test:</h3>
              <div className="bg-gray-100 p-4 rounded">
                {apiTest === null ? (
                  <p>⏳ Testing API...</p>
                ) : apiTest.success ? (
                  <div className="text-green-800">
                    <p>✅ API Access: Working</p>
                    <p><strong>Is Admin:</strong> {apiTest.data.isAdmin ? 'Yes' : 'No'}</p>
                    <p><strong>Member ID:</strong> {apiTest.data.member?.id}</p>
                  </div>
                ) : (
                  <div className="text-red-800">
                    <p>❌ API Error: {apiTest.error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Comparison */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">�️ Visual Comparison Test</h2>
          <p className="mb-4">Open these URLs in separate tabs to compare:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-bold text-blue-800 mb-2">🎯 Subdomain Access</h3>
              <a 
                href="https://admin.berkomunitas.com/" 
                target="_blank" 
                className="text-blue-600 hover:underline block mb-2"
              >
                https://admin.berkomunitas.com/
              </a>
              <p className="text-sm text-gray-600">Should be identical to direct access</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-bold text-green-800 mb-2">🎯 Direct Access</h3>
              <a 
                href="https://berkomunitas.com/admin-app/" 
                target="_blank" 
                className="text-green-600 hover:underline block mb-2"
              >
                https://berkomunitas.com/admin-app/
              </a>
              <p className="text-sm text-gray-600">Reference implementation</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => window.location.href = '/admin-app'}
              className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600"
            >
              Go to Admin App Root
            </button>
            <button 
              onClick={() => window.open('/api/debug/admin', '_blank')}
              className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600"
            >
              Test Admin API
            </button>
            <button 
              onClick={() => window.location.href = 'https://berkomunitas.com'}
              className="bg-purple-500 text-white px-6 py-3 rounded hover:bg-purple-600"
            >
              Back to Main Site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
