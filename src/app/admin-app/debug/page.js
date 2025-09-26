'use client';

export default function DebugMiddleware() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Middleware Debug</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Current Page Info</h2>
          <div className="space-y-2">
            <p><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
            <p><strong>Hostname:</strong> {typeof window !== 'undefined' ? window.location.hostname : 'SSR'}</p>
            <p><strong>Pathname:</strong> {typeof window !== 'undefined' ? window.location.pathname : 'SSR'}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Expected Behavior</h2>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded">
              <p className="text-green-800">
                ✅ <strong>admin.berkomunitas.com/debug</strong><br/>
                Should rewrite to <strong>/admin-app/debug</strong> and show this page
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded">
              <p className="text-blue-800">
                📝 <strong>berkomunitas.com/admin-app/debug</strong><br/>
                Should show this page directly without rewrite
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
