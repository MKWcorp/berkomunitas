'use client';
import { useState } from 'react';
import GlassCard from '../../components/GlassCard';

export default function FixEmailsTab() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/fix-missing-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' }),
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFix = async () => {
    if (!confirm('Are you sure you want to fix missing emails? This will fetch data from Clerk.')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/fix-missing-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fix' }),
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard padding="lg">
        <h2 className="text-2xl font-bold mb-4">Fix Missing Emails</h2>
        
        <p className="text-gray-700 mb-6">
          This tool helps fix members who don't have email records by fetching their email data from Clerk.
        </p>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleCheck}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Check Missing Emails'}
          </button>
          
          <button
            onClick={handleFix}
            disabled={loading}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Fix Missing Emails'}
          </button>
        </div>
      </GlassCard>

      {results && (
        <GlassCard variant="subtle" padding="lg">
          <h3 className="text-xl font-semibold mb-4">Results</h3>
          
          {results.success ? (
            <div>
              {results.members ? (
                // Check results
                <div>
                  <p className="text-green-600 font-semibold mb-4">
                    ✅ Found {results.members.length} members without emails
                  </p>
                  
                  {results.members.length > 0 && (
                    <div className="bg-white rounded-lg p-4 max-h-60 overflow-y-auto">
                      <h4 className="font-semibold mb-2">Members without emails:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {results.members.map((member) => (
                          <li key={member.id}>
                            <span className="font-medium">{member.nama_lengkap || 'No name'}</span>
                            <span className="text-gray-500 ml-2">({member.clerk_id})</span>
                            <span className="text-gray-400 ml-2">
                              - {new Date(member.tanggal_daftar).toLocaleDateString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : results.summary ? (
                // Fix results
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center bg-blue-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600">
                        {results.summary.total_processed}
                      </div>
                      <div className="text-sm text-blue-700">Total Processed</div>
                    </div>
                    <div className="text-center bg-green-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600">
                        {results.summary.emails_fixed}
                      </div>
                      <div className="text-sm text-green-700">Emails Fixed</div>
                    </div>
                    <div className="text-center bg-red-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-red-600">
                        {results.summary.errors}
                      </div>
                      <div className="text-sm text-red-700">Errors</div>
                    </div>
                    <div className="text-center bg-yellow-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-yellow-600">
                        {results.summary.no_email_in_clerk}
                      </div>
                      <div className="text-sm text-yellow-700">No Email in Clerk</div>
                    </div>
                  </div>
                  
                  {results.results && results.results.length > 0 && (
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Detailed Results:</h4>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {results.results.map((result, index) => (
                          <div key={index} className={`p-3 rounded-lg border-l-4 ${
                            result.status === 'success' 
                              ? 'border-green-500 bg-green-50'
                              : result.status === 'error'
                                ? 'border-red-500 bg-red-50'
                                : 'border-yellow-500 bg-yellow-50'
                          }`}>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium">{result.nama_lengkap}</div>
                                <div className="text-sm text-gray-600">{result.clerk_id}</div>
                                {result.primary_email && (
                                  <div className="text-sm text-green-700 font-medium">
                                    📧 {result.primary_email}
                                  </div>
                                )}
                                {result.error && (
                                  <div className="text-sm text-red-600">
                                    ❌ {result.error}
                                  </div>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <div className={`px-2 py-1 rounded text-xs font-medium ${
                                  result.status === 'success' 
                                    ? 'bg-green-100 text-green-800'
                                    : result.status === 'error'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {result.status.toUpperCase()}
                                </div>
                                {result.emails_added > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    +{result.emails_added} email(s)
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-600 font-semibold">❌ Error</div>
              <div className="text-red-700">{results.error}</div>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
