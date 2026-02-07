'use client';

import { useState, useRef, useEffect } from 'react';
import { FunnelIcon, MagnifyingGlassIcon, LinkIcon } from '@heroicons/react/24/outline';

// Manual Link Component
function ManualLinkSearch({ employeeId, onLink }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchMembers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      const response = await fetch(`/api/drwcorp/search-members?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.members || []);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Error searching members:', error);
      setSearchResults([]);
    }
  };

  const handleLink = async (member) => {
    setIsLinking(true);
    await onLink(employeeId, member.id);
    setSearchQuery('');
    setShowDropdown(false);
    setIsLinking(false);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <MagnifyingGlassIcon className="w-3 h-3 absolute left-1.5 top-1.5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchMembers(e.target.value);
          }}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder="Cari member..."
          className="w-full pl-6 pr-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
          disabled={isLinking}
        />
      </div>
      
      {showDropdown && searchResults.length > 0 && (
        <div className="absolute z-20 mt-1 w-[280px] bg-white border border-gray-300 rounded-lg shadow-lg max-h-[200px] overflow-y-auto right-0">
          {searchResults.map((member) => (
            <div
              key={member.id}
              onClick={() => handleLink(member)}
              className="px-2 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
            >
              <div className="font-medium text-xs text-gray-800">{member.nama_lengkap}</div>
              <div className="text-xs text-gray-600">{member.email}</div>
              <div className="text-xs text-blue-600 mt-0.5">{member.loyalty_point} pts</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EmployeeManagement({
  filteredEmployees,
  selectedDivisi,
  setSelectedDivisi,
  selectedStatus,
  setSelectedStatus,
  searchQuery,
  setSearchQuery,
  divisiList,
  loading,
  confirmMatch
}) {
  const getStatusBadge = (status) => {
    const config = {
      matched: { color: 'text-green-600', label: '✓', bg: 'bg-green-50' },
      ambiguous: { color: 'text-yellow-600', label: '⚠', bg: 'bg-yellow-50' },
      unmatched: { color: 'text-red-600', label: '✗', bg: 'bg-red-50' }
    };
    
    return config[status] || config.unmatched;
  };

  return (
    <div className="space-y-3">
      {/* Compact Filters */}
      <div className="flex flex-wrap gap-2 items-center text-sm">
        <FunnelIcon className="w-4 h-4 text-gray-500" />
        
        {/* Status Quick Filters */}
        <div className="flex gap-1">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedStatus === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedStatus('matched')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedStatus === 'matched' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✓ Matched
          </button>
          <button
            onClick={() => setSelectedStatus('ambiguous')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedStatus === 'ambiguous' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⚠ Ambiguous
          </button>
          <button
            onClick={() => setSelectedStatus('unmatched')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedStatus === 'unmatched' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✗ Unmatched
          </button>
        </div>
        
        <div className="border-l border-gray-300 h-6"></div>
        
        {/* Divisi Filter */}
        <select
          value={selectedDivisi}
          onChange={(e) => setSelectedDivisi(e.target.value)}
          className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Semua Divisi</option>
          {divisiList.map(divisi => (
            <option key={divisi} value={divisi}>{divisi}</option>
          ))}
        </select>
        
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-2 top-1.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau email..."
              className="w-full pl-8 pr-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-xs text-gray-600">
        Menampilkan {filteredEmployees.length} karyawan
      </div>

      {/* Employee Table - Compact */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : filteredEmployees.length > 0 ? (
          <div className="overflow-x-auto max-h-[calc(100vh-250px)] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Nama</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Email</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Divisi</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Member Link</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map(emp => {
                  const badge = getStatusBadge(emp.matching_status);
                  
                  return (
                    <tr key={emp.id} className={`hover:bg-gray-50 ${badge.bg}`}>
                      <td className="px-3 py-2">
                        <span className={`font-bold ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-800">
                        {emp.nama_lengkap}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {emp.email}
                      </td>
                      <td className="px-3 py-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                          {emp.divisi}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {emp.members ? (
                          <div className="text-green-700">
                            <div className="font-medium">{emp.members.nama_lengkap}</div>
                            <div className="text-gray-500">{emp.members.loyalty_point} pts</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="space-y-1">
                          {/* Auto Suggestions */}
                          {emp.matching_status === 'ambiguous' && emp.matching_suggestions && emp.matching_suggestions.length > 0 && (
                            <details className="relative">
                              <summary className="cursor-pointer text-blue-600 hover:underline text-xs">
                                {emp.matching_suggestions.length} auto suggestions
                              </summary>
                              <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2 min-w-[300px] right-0">
                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                  {emp.matching_suggestions.map(sug => (
                                    <div key={sug.member_id} className="border-b pb-2 last:border-0">
                                      <div className="font-medium text-gray-800">{sug.nama_lengkap}</div>
                                      <div className="text-gray-600">{sug.email}</div>
                                      <div className="flex justify-between items-center mt-1">
                                        <span className="text-gray-500">{(sug.confidence * 100).toFixed(0)}%</span>
                                        <button
                                          onClick={() => confirmMatch(emp.id, sug.member_id)}
                                          className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                                        >
                                          Confirm
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </details>
                          )}
                          
                          {/* Manual Link Search */}
                          {!emp.members && (
                            <div className="flex items-center gap-1">
                              <LinkIcon className="w-3 h-3 text-gray-400" />
                              <ManualLinkSearch 
                                employeeId={emp.id} 
                                onLink={confirmMatch}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8 text-sm">
            Tidak ada karyawan ditemukan
          </div>
        )}
      </div>
    </div>
  );
}
