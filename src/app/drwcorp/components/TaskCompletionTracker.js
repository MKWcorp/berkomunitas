'use client';

import { CheckCircleIcon, DocumentDuplicateIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useState, useRef, useEffect } from 'react';

export default function TaskCompletionTracker({
  selectedTask,
  selectedTaskData,
  taskSearchQuery,
  setTaskSearchQuery,
  taskSearchResults,
  showTaskDropdown,
  setShowTaskDropdown,
  searchTasks,
  selectTask,
  taskDivisi,
  setTaskDivisi,
  divisiList,
  taskStats,
  completionTab,
  setCompletionTab,
  completedEmployees,
  notCompletedEmployees,
  copyToClipboard,
  copySuccess
}) {
  const searchRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowTaskDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowTaskDropdown]);
  
  return (
    <div className="space-y-3">
      {/* Compact Filters */}
      <div className="flex flex-wrap gap-2 items-center text-sm">
        <FunnelIcon className="w-4 h-4 text-gray-500" />
        
        {/* Task Search with Autocomplete */}
        <div className="flex-1 min-w-[250px] relative" ref={searchRef}>
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-2 top-1.5 text-gray-400" />
            <input
              type="text"
              value={taskSearchQuery}
              onChange={(e) => {
                setTaskSearchQuery(e.target.value);
                searchTasks(e.target.value);
              }}
              onFocus={() => {
                if (taskSearchResults.length > 0) {
                  setShowTaskDropdown(true);
                }
              }}
              placeholder="Cari tugas (keyword atau deskripsi)..."
              className="w-full pl-8 pr-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Autocomplete Dropdown */}
          {showTaskDropdown && taskSearchResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
              {taskSearchResults.map((task) => (
                <div
                  key={task.id}
                  onClick={() => selectTask(task)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                >
                  <div className="font-medium text-sm text-gray-800">
                    {task.keyword_tugas || `Task #${task.id}`}
                  </div>
                  {task.deskripsi_tugas && (
                    <div className="text-xs text-gray-600 truncate">
                      {task.deskripsi_tugas.substring(0, 80)}...
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(task.post_timestamp).toLocaleDateString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <select
          value={taskDivisi}
          onChange={(e) => setTaskDivisi(e.target.value)}
          className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Semua Divisi</option>
          {divisiList.map(divisi => (
            <option key={divisi} value={divisi}>{divisi}</option>
          ))}
        </select>

        {/* Task Stats Inline */}
        {taskStats && (
          <>
            <div className="border-l border-gray-300 h-6"></div>
            <div className="flex gap-3 text-xs">
              <div>
                <span className="font-semibold text-gray-900">{taskStats.total_employees}</span>
                <span className="text-gray-600"> Total</span>
              </div>
              <div>
                <span className="font-semibold text-green-600">{taskStats.completed_count}</span>
                <span className="text-gray-600"> Selesai</span>
              </div>
              <div>
                <span className="font-semibold text-red-600">{taskStats.not_completed_count}</span>
                <span className="text-gray-600"> Belum</span>
              </div>
              <div>
                <span className="font-semibold text-blue-600">{taskStats.completion_rate}%</span>
                <span className="text-gray-600"> Rate</span>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Selected Task Info */}
      {selectedTaskData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="font-semibold text-sm text-blue-900">
                {selectedTaskData.keyword_tugas || `Task #${selectedTaskData.id}`}
              </div>
              {selectedTaskData.deskripsi_tugas && (
                <div className="text-xs text-blue-700 mt-1">
                  {selectedTaskData.deskripsi_tugas}
                </div>
              )}
              <div className="text-xs text-blue-600 mt-1">
                Posted: {new Date(selectedTaskData.post_timestamp).toLocaleDateString('id-ID', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </div>
            </div>
            <button
              onClick={() => selectTask(null)}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              ✕ Clear
            </button>
          </div>
        </div>
      )}

      {/* No Task Selected Message */}
      {!selectedTask && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 font-medium">Pilih tugas terlebih dahulu</p>
          <p className="text-xs text-gray-500 mt-1">Gunakan search box di atas untuk mencari tugas</p>
        </div>
      )}

      {/* Completion Tabs */}
      {selectedTask && (
        <div>
          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600 mt-2">Loading data...</p>
            </div>
          )}

          {/* Tab Headers with Copy Button */}
          {!loading && (
            <>
          <div className="flex items-center justify-between border-b border-gray-200 mb-2">
            <div className="flex">
              <button
                onClick={() => setCompletionTab('not-completed')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  completionTab === 'not-completed'
                    ? 'border-b-2 border-red-500 text-red-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                ❌ Belum ({notCompletedEmployees.length})
              </button>
              <button
                onClick={() => setCompletionTab('completed')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  completionTab === 'completed'
                    ? 'border-b-2 border-green-500 text-green-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                ✅ Sudah ({completedEmployees.length})
              </button>
            </div>
            <button
              onClick={() => copyToClipboard(
                completionTab === 'completed' ? completedEmployees : notCompletedEmployees
              )}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <DocumentDuplicateIcon className="w-3 h-3" />
              {copySuccess ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Employee Table - Compact */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {completionTab === 'not-completed' ? (
              notCompletedEmployees.length > 0 ? (
                <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">No</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Nama</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Email</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Divisi</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {notCompletedEmployees.map((emp, idx) => (
                        <tr key={emp.id} className="hover:bg-red-50">
                          <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium text-gray-800">{emp.nama_lengkap}</td>
                          <td className="px-3 py-2 text-gray-600">{emp.email}</td>
                          <td className="px-3 py-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                              {emp.divisi}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {emp.matching_status !== 'matched' ? (
                              <span className="text-orange-600">⚠ {emp.matching_status}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8 text-sm">
                  🎉 Semua karyawan sudah mengerjakan!
                </div>
              )
            ) : (
              completedEmployees.length > 0 ? (
                <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">No</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Nama</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Email</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Divisi</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {completedEmployees.map((emp, idx) => (
                        <tr key={emp.id} className="hover:bg-green-50">
                          <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium text-gray-800">{emp.nama_lengkap}</td>
                          <td className="px-3 py-2 text-gray-600">{emp.email}</td>
                          <td className="px-3 py-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                              {emp.divisi}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-green-600">
                            {emp.submission ? (
                              <span>✓ {new Date(emp.submission.tanggal_submission).toLocaleDateString('id-ID')}</span>
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8 text-sm">
                  Belum ada yang mengerjakan
                </div>
              )
            )}
          </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
