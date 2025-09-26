'use client';
import { useState } from 'react';

export default function FixMissingEmailsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [action, setAction] = useState('check');

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
    } catch (____error) {
      setResults({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFix = async () => {
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
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Fix Missing Emails</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <p className="text-gray-700 mb-4">
          This tool helps fix members who don't have email records by fetching their email data from Clerk.
        </p>
        
        <div className="flex gap-4">
          <button
            onClick={handleCheck}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : 'Check Members Without Emails'}
          </button>
          
          <button
            onClick={handleFix}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : 'Fix Missing Emails'}
          </button>
        </div>
      </div>

      {results && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Results</h3>
          
          {results.success ? (
            <div>
              {results.members ? (
                <div>
                  <p className="text-green-600 font-semibold mb-4">
                    Found {results.members.length} members without emails
                  </p>
                  
                  {results.members.length > 0 && (
                    <div className="max-h-60 overflow-y-auto">
                      <ul className="list-disc list-inside space-y-1">
                        {results.members.map((member) => (
                          <li key={member._id} className="text-sm">
                            {member.nama_lengkap || 'No name'} - {member.clerk_id}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : results.summary ? (
                <div>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">
                        {results.summary.total_processed}
                      </div>
                      <div className="text-sm">Processed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">
                        {results.summary.emails_fixed}
                      </div>
                      <div className="text-sm">Fixed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-600">
                        {results.summary.errors}
                      </div>
                      <div className="text-sm">Errors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-yellow-600">
                        {results.summary.no_email_in_clerk}
                      </div>
                      <div className="text-sm">No Email</div>
                    </div>
                  </div>
                  
                  {results.results && (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {results.results.map((result, _index) => (
                        <div key={index} className={`p-2 rounded ${
                          result.status === 'success' ? 'bg-green-100' :
                          result.status === 'error' ? 'bg-red-100' : 'bg-yellow-100'
                        }`}>
                          <div className="font-medium">{result.nama_lengkap}</div>
                          <div className="text-sm text-gray-600">{result.clerk_id}</div>
                          {result.primary_email && (
                            <div className="text-sm text-green-700">📧 {result.primary_email}</div>
                          )}
                          {result.error && (
                            <div className="text-sm text-red-600">❌ {result.error}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-red-600">
              Error: {results.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
