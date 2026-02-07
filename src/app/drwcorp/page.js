'use client';

import { useState, useEffect } from 'react';
import { 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  ClipboardDocumentCheckIcon 
} from '@heroicons/react/24/outline';
import StatisticsCards from './components/StatisticsCards';
import TaskCompletionTracker from './components/TaskCompletionTracker';
import EmployeeManagement from './components/EmployeeManagement';

export default function DrwcorpDashboard() {
  const [activeTab, setActiveTab] = useState('task-completion');
  
  // Employees tab state
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [divisiList, setDivisiList] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedDivisi, setSelectedDivisi] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Task completion tab state
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTaskData, setSelectedTaskData] = useState(null);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskSearchResults, setTaskSearchResults] = useState([]);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [taskDivisi, setTaskDivisi] = useState('all');
  const [completedEmployees, setCompletedEmployees] = useState([]);
  const [notCompletedEmployees, setNotCompletedEmployees] = useState([]);
  const [taskStats, setTaskStats] = useState(null);
  const [completionTab, setCompletionTab] = useState('not-completed');
  
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  // Fetch employees data
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/drwcorp/employees');
      const data = await response.json();
      
      if (data.success) {
        setEmployees(data.employees);
        setFilteredEmployees(data.employees);
        setDivisiList(data.divisiList);
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search tasks
  const searchTasks = async (query) => {
    if (!query || query.length < 2) {
      setTaskSearchResults([]);
      setShowTaskDropdown(false);
      return;
    }
    
    try {
      console.log('[Task Search] Searching for:', query);
      
      // Check if query is a URL or contains task ID
      const urlPattern = /(?:https?:\/\/)?(?:www\.)?berkomunitas\.com\/tugas\/(\d+)/i;
      const idPattern = /^(\d+)$/;
      
      let searchQuery = query;
      const urlMatch = query.match(urlPattern);
      const idMatch = query.match(idPattern);
      
      if (urlMatch || idMatch) {
        // Extract ID from URL or use direct ID
        const taskId = urlMatch ? urlMatch[1] : idMatch[1];
        searchQuery = taskId;
        console.log('[Task Search] Detected task ID:', taskId);
      }
      
      const url = `/api/admin/tugas?q=${encodeURIComponent(searchQuery)}&limit=10`;
      console.log('[Task Search] Fetching:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('[Task Search] Response:', data);
      
      if (data.success) {
        setTaskSearchResults(data.tasks || []);
        setShowTaskDropdown(true);
        console.log('[Task Search] Found tasks:', data.tasks?.length || 0);
      } else {
        console.log('[Task Search] No success:', data.error);
      }
    } catch (error) {
      console.error('[Task Search] Error:', error);
      setTaskSearchResults([]);
    }
  };
  
  // Select task from search results
  const selectTask = (task) => {
    if (!task) {
      // Clear selection
      setSelectedTask(null);
      setSelectedTaskData(null);
      setTaskSearchQuery('');
      setCompletedEmployees([]);
      setNotCompletedEmployees([]);
      setTaskStats(null);
      return;
    }
    
    setSelectedTask(task.id);
    setSelectedTaskData(task);
    setTaskSearchQuery(task.keyword_tugas || task.deskripsi_tugas || `Task #${task.id}`);
    setShowTaskDropdown(false);
  };

  // Fetch task completion data
  const fetchTaskCompletion = async (taskId, divisi = 'all') => {
    if (!taskId) return;
    
    try {
      setLoading(true);
      const url = `/api/drwcorp/task-completion?taskId=${taskId}${divisi !== 'all' ? `&divisi=${divisi}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setCompletedEmployees(data.completed);
        setNotCompletedEmployees(data.notCompleted);
        setTaskStats(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching task completion:', error);
    } finally {
      setLoading(false);
    }
  };

  // Confirm member match
  const confirmMatch = async (employeeId, memberId) => {
    try {
      const response = await fetch(`/api/drwcorp/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchEmployees();
        alert('✅ Match confirmed!');
      }
    } catch (error) {
      console.error('Error confirming match:', error);
      alert('❌ Failed to confirm match');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (list, tabType) => {
    // Add title based on tab type
    let title = '';
    if (selectedTaskData) {
      const taskLink = `https://berkomunitas.com/tugas/${selectedTaskData.id}`;
      if (tabType === 'completed') {
        title = `Yang Sudah Mengerjakan tugas ${taskLink}\n\n`;
      } else {
        title = `Yang belum mengerjakan tugas ${taskLink}\n\n`;
      }
    }
    
    // Group by division
    const grouped = list.reduce((acc, emp) => {
      const divisi = emp.divisi || 'Tidak ada divisi';
      if (!acc[divisi]) {
        acc[divisi] = [];
      }
      acc[divisi].push(emp.nama_lengkap);
      return acc;
    }, {});
    
    // Sort divisions A-Z
    const sortedDivisions = Object.keys(grouped).sort((a, b) => 
      a.localeCompare(b, 'id', { sensitivity: 'base' })
    );
    
    // Build text with sorted names in each division
    const content = sortedDivisions.map(divisi => {
      // Sort names A-Z
      const sortedNames = grouped[divisi].sort((a, b) => 
        a.localeCompare(b, 'id', { sensitivity: 'base' })
      );
      
      return `${divisi}\n\n${sortedNames.join('\n')}`;
    }).join('\n\n');
    
    const text = title + content;
    
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Filter employees
  useEffect(() => {
    let filtered = employees;
    
    if (selectedDivisi !== 'all') {
      filtered = filtered.filter(e => e.divisi === selectedDivisi);
    }
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(e => e.matching_status === selectedStatus);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.nama_lengkap.toLowerCase().includes(query) ||
        e.email.toLowerCase().includes(query)
      );
    }
    
    setFilteredEmployees(filtered);
  }, [employees, selectedDivisi, selectedStatus, searchQuery]);

  // Initial load
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle task selection
  useEffect(() => {
    if (selectedTask) {
      fetchTaskCompletion(selectedTask, taskDivisi);
    }
  }, [selectedTask, taskDivisi]);

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-3">
      <div className="max-w-7xl mx-auto space-y-2">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
              <h1 className="text-lg font-bold text-gray-800">DRWCorp HR Dashboard</h1>
            </div>
            <StatisticsCards statistics={statistics} />
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('task-completion')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'task-completion'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ClipboardDocumentCheckIcon className="w-4 h-4 inline mr-1" />
              Task Tracker
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'employees'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <UserGroupIcon className="w-4 h-4 inline mr-1" />
              Employees
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-3">
            {activeTab === 'task-completion' && (
              <TaskCompletionTracker
                selectedTask={selectedTask}
                selectedTaskData={selectedTaskData}
                taskSearchQuery={taskSearchQuery}
                setTaskSearchQuery={setTaskSearchQuery}
                taskSearchResults={taskSearchResults}
                showTaskDropdown={showTaskDropdown}
                setShowTaskDropdown={setShowTaskDropdown}
                searchTasks={searchTasks}
                selectTask={selectTask}
                taskDivisi={taskDivisi}
                setTaskDivisi={setTaskDivisi}
                divisiList={divisiList}
                taskStats={taskStats}
                completionTab={completionTab}
                setCompletionTab={setCompletionTab}
                completedEmployees={completedEmployees}
                notCompletedEmployees={notCompletedEmployees}
                copyToClipboard={copyToClipboard}
                copySuccess={copySuccess}
                loading={loading}
              />
            )}

            {activeTab === 'employees' && (
              <EmployeeManagement
                filteredEmployees={filteredEmployees}
                selectedDivisi={selectedDivisi}
                setSelectedDivisi={setSelectedDivisi}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                divisiList={divisiList}
                loading={loading}
                confirmMatch={confirmMatch}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
