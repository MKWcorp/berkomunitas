'use client';
import { useState } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';

export default function GeneratePhotosTab() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [options, setOptions] = useState({
    dryRun: true,
    limit: 10,
    syncFromClerkFirst: true,
    generateForMissingOnly: true
  });

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/generate-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
        credentials: 'include'
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <PhotoIcon className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Generate Profile Photos</h2>
          <p className="text-gray-600">Generate foto profil untuk members yang belum punya foto profil</p>
        </div>
      </div>

      {/* Options */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3">⚙️ Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={options.dryRun}
              onChange={(e) => setOptions(prev => ({ ...prev, dryRun: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex flex-col">
              <span className="font-medium">🧪 Dry Run</span>
              <span className="text-sm text-gray-600">Preview only, tidak apply ke database</span>
            </div>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={options.syncFromClerkFirst}
              onChange={(e) => setOptions(prev => ({ ...prev, syncFromClerkFirst: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex flex-col">
              <span className="font-medium">📸 Sync from Clerk</span>
              <span className="text-sm text-gray-600">Coba ambil foto dari Clerk dulu</span>
            </div>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={options.generateForMissingOnly}
              onChange={(e) => setOptions(prev => ({ ...prev, generateForMissingOnly: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex flex-col">
              <span className="font-medium">🎯 Missing Only</span>
              <span className="text-sm text-gray-600">Hanya member yang belum punya foto</span>
            </div>
          </label>

          <div className="flex items-center space-x-3">
            <label className="font-medium">📊 Limit:</label>
            <input
              type="number"
              value={options.limit}
              onChange={(e) => setOptions(prev => ({ ...prev, limit: parseInt(e.target.value) || 10 }))}
              className="border border-gray-300 rounded-md px-3 py-1 w-20 focus:ring-blue-500 focus:border-blue-500"
              min="1"
              max="100"
            />
            <span className="text-sm text-gray-600">member (max 100)</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            loading 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
          }`}
        >
          {loading ? '⏳ Processing...' : '🚀 Generate Photos'}
        </button>

        <button
          onClick={() => {
            setOptions({ dryRun: true, limit: 5, syncFromClerkFirst: true, generateForMissingOnly: true });
            setTimeout(handleGenerate, 100);
          }}
          disabled={loading}
          className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
        >
          🧪 Quick Preview (5 members)
        </button>
        
        <button
          onClick={() => {
            setOptions({ dryRun: false, limit: 20, syncFromClerkFirst: true, generateForMissingOnly: true });
            setTimeout(handleGenerate, 100);
          }}
          disabled={loading}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          ✅ Generate (20 members)
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className={`rounded-lg border p-4 ${
          result.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <h3 className="font-bold text-lg mb-3">
            {result.success ? '✅ Success' : '❌ Error'}
          </h3>
          
          {result.error && (
            <div className="bg-red-100 border border-red-300 rounded p-3 mb-4">
              <p className="text-red-800 font-medium">{result.error}</p>
            </div>
          )}

          {result.logs && (
            <div>
              <h4 className="font-medium mb-2 text-gray-800">📋 Execution Log:</h4>
              <div className="bg-gray-800 text-green-400 text-sm rounded p-3 max-h-80 overflow-y-auto font-mono">
                <pre className="whitespace-pre-wrap">{result.logs.join('\n')}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3">ℹ️ Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p className="mb-2"><strong>Avatar Service:</strong> DiceBear Avataaars</p>
            <p className="mb-2"><strong>Size:</strong> 200x200 pixels</p>
            <p><strong>Format:</strong> SVG (scalable)</p>
          </div>
          <div>
            <p className="mb-2"><strong>Priority:</strong> Clerk photos → Generated avatars</p>
            <p className="mb-2"><strong>Safe Mode:</strong> Limit + Dry run available</p>
            <p><strong>Processing:</strong> Real-time logs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
