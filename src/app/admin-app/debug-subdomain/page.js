'use client';
import { useEffect, useState } from 'react';

export default function DebugSubdomainPage() {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    setDebugInfo({
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      fullUrl: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Debug Subdomain Info</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Location</h2>
          <div className="space-y-2 font-mono text-sm">
            <div><strong>Hostname:</strong> {debugInfo.hostname}</div>
            <div><strong>Pathname:</strong> {debugInfo.pathname}</div>
            <div><strong>Full URL:</strong> {debugInfo.fullUrl}</div>
            <div><strong>User Agent:</strong> {debugInfo.userAgent}</div>
            <div><strong>Timestamp:</strong> {debugInfo.timestamp}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Links</h2>
          <div className="space-y-2">
            <div>
              <a href="/admin-app/dashboard" className="text-blue-600 hover:underline">
                → /admin-app/dashboard (relative)
              </a>
            </div>
            <div>
              <a href="https://berkomunitas.com/admin-app/dashboard" className="text-blue-600 hover:underline">
                → https://berkomunitas.com/admin-app/dashboard (absolute)
              </a>
            </div>
            <div>
              <a href="https://admin.berkomunitas.com/dashboard" className="text-blue-600 hover:underline">
                → https://admin.berkomunitas.com/dashboard (subdomain)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
