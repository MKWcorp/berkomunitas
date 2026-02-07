'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { useRouter } from 'next/navigation';
import Confetti from 'react-confetti';
import GlassCard from '../components/GlassCard';
import ProfileCompletionBanner from '../../components/ProfileCompletionBanner';
import ProfileGatedButton from '../../components/ProfileGatedButton';
import EventBoostBanner, { EventBoostInlineDisplay, EventBoostTableDisplay } from '../../components/EventBoostComponents';
import { useMultipleEventBoost } from '../../hooks/useMultipleEventBoost';
import { useEventBoostSync } from '../../hooks/useEventBoostSync';
import { useProfileCompletion } from '../../hooks/useProfileCompletion';
import { 
  PlayCircleIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import { ShareIcon, EyeIcon } from '@heroicons/react/24/outline';

// Mapping for dynamic background color by source_profile_link
const SOURCE_BG_COLORS = {
  drwskincareshop: 'bg-gray-100',
  klinikdrwskincarepurworejo: 'bg-gray-100',
  testimoniidrw: 'bg-gray-100',
  beautycenterdrw: 'bg-gray-100',
  beautyprenenurdrw: 'bg-gray-100',
  klinikdrwskincarekutoarjo: 'bg-gray-100',
  dzawanikost: 'bg-gray-100',
  default: 'bg-gray-100',
};

// Reusable component for displaying task statistics with click functionality
function StatCard({ title, value, _bgColor = 'bg-white', textColor = 'text-gray-800', onClick, isActive = false, tooltip = null }) {
  const activeClasses = isActive ? 'ring-2 ring-indigo-500/50 shadow-lg' : '';
  
  return (
    <GlassCard 
      variant={isActive ? "strong" : "default"}
      padding="none"
      className={`text-center cursor-pointer hover:scale-105 transform transition-all duration-300 ${activeClasses} relative group p-3 sm:p-5`}
      onClick={onClick}
      hover
    >
      <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase truncate">{title}</h3>
      <p className={`text-lg sm:text-2xl font-bold ${textColor} mt-1`}>{value}</p>
      {isActive && (
        <div className="mt-2">
          <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full"></span>
        </div>
      )}
      {tooltip && (
        <div className="hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </GlassCard>
  );
}

// Helper function for background color
function _getSourceBgColor(source) {
  if (!source) {
    return SOURCE_BG_COLORS.default;
  }
  return SOURCE_BG_COLORS[source] || SOURCE_BG_COLORS.default;
}

export default function TugasPage() {
  const { user, isLoaded, isSignedIn } = useSSOUser();
  const router = useRouter();
  
  // Profile completion check
  const { isComplete: isProfileComplete, loading: profileLoading, message: profileMessage, socialMediaProfiles } = useProfileCompletion();
  
  const [tasks, setTasks] = useState([]);
  const [memberId, setMemberId] = useState(null); // Add memberId state
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [_page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();
  const [filter, setFilter] = useState('belum'); // 'semua' | 'selesai' | 'belum' | 'verifikasi' - default to 'belum'
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimeoutRef = useRef();
    // Add state for task statistics
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    incomplete: 0,
    verifying: 0 // Add verification count
  });  
  const [statsLoading, setStatsLoading] = useState(true);

  // Event boost hook - menggunakan multiple event system untuk menangkap semua event aktif
  // Dengan fallback ke single event system jika terjadi error
  const { 
    activeEvents, 
    hasActiveEvents,
    highestBoostEvent,
    isLoading: eventLoading
  } = useMultipleEventBoost();

  // Fallback using single event hook jika multiple event gagal
  const { 
    isActive: fallbackEventActive, 
    boostPercentage: fallbackBoostPercentage, 
    pointValue: fallbackEventPointValue, 
    title: fallbackEventTitle, 
    description: fallbackEventDescription,
    isInActivePeriod: fallbackIsInActivePeriod
  } = useEventBoostSync('WEEKEND_BOOST');

  // Get the highest boost event untuk display atau gunakan fallback
  const isEventActive = hasActiveEvents || fallbackEventActive;
  const boostPercentage = highestBoostEvent?.boostPercentage || fallbackBoostPercentage || 200;
  const eventPointValue = highestBoostEvent?.pointValue || fallbackEventPointValue || 20;
  const eventTitle = highestBoostEvent?.title || fallbackEventTitle || "EVENT BOOST AKTIF!";
  const eventDescription = highestBoostEvent?.description || fallbackEventDescription || "Dapatkan poin berlipat untuk semua tugas!";
  const isInActivePeriod = hasActiveEvents || fallbackIsInActivePeriod; // Multiple event sudah menangani validasi periode

  // Debug state - will be set after component mounts
  const [debugTasks, setDebugTasks] = useState(false);

  // Set debug flag after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isDebug = urlParams.get('debugTasks') === '1';
      setDebugTasks(isDebug);
      console.log('🐛 Debug mode:', isDebug);
    }
  }, []);
  // Fetch tasks function - using functional updates to avoid stale closures
  const fetchTasks = useCallback(async (currentPage, currentFilter) => {
    // Get current filter if not provided
    const filterToUse = currentFilter !== undefined ? currentFilter : filter;
    
    setLoading(currentPage === 1);
    setLoadingMore(currentPage > 1);
    try {
      const filterParam = filterToUse !== 'semua' ? `&filter=${filterToUse}` : '';
      const response = await fetch(`/api/tugas?page=${currentPage}&limit=10${filterParam}`, { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Autentikasi gagal. Silakan login kembali.');
        }
        throw new Error('Gagal memuat data tugas.');
      }
      const result = await response.json();
      console.log('🔍 API Response received:', { success: result.success, tasksCount: result.tasks?.length });
      
      // Use debugTasks from current state via functional update
      setDebugTasks(currentDebug => {
        if (currentDebug) {
          console.debug('🐛 Full API /api/tugas result:', result);
          console.debug('🐛 First task sample:', result.tasks?.[0]);
          console.debug('🐛 Task fields check:', result.tasks?.map(t => ({
            id: t.id,
            nama_tugas: t.nama_tugas,
            deskripsi_tugas: t.deskripsi_tugas,
            keyword_tugas: t.keyword_tugas
          })));
        }
        return currentDebug; // Return unchanged value
      });
      
      if (result.success) {
        setTasks(prevTasks => {
          const newTasks = currentPage === 1 ? result.tasks : [...prevTasks, ...result.tasks];
          // Remove duplicates based on task ID to prevent React key conflicts
          const uniqueTasks = newTasks.filter((task, index, arr) => 
            arr.findIndex(t => t.id === task.id) === index
          );
          return uniqueTasks;
        });
        setMemberId(result.memberId); // Set memberId from API response
        setHasMore(result.pagination.page < result.pagination.totalPages);
      } else {
        throw new Error(result.error || 'Gagal memuat data tugas.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);    }
  }, [filter]); // Include filter as dependency since it's used in default value

  // Fetch task statistics from API - separate from fetchTasks
  const fetchTaskStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await fetch('/api/tugas/stats', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch task statistics');
      }
      const result = await response.json();
      if (result.success) {
        setTaskStats(result.stats);
      }
    } catch (err) {
      console.error('Error fetching task stats:', err);
      // Fallback calculation - direct access without dependency
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Initial fetch when user is loaded - consolidated to prevent dependency loops
  useEffect(() => {
    if (isLoaded && user) {
      // Fetch both tasks and stats in sequence to avoid race conditions
      const initializeData = async () => {
        try {
          await fetchTasks(1);
          await fetchTaskStats();
        } catch (error) {
          console.error('Error initializing data:', error);
          setError(error.message);
        }
      };
      initializeData();
    } else if (isLoaded && !user) {
      setLoading(false);
      setError("Silakan login untuk melihat tugas.");
    }
  }, [isLoaded, user, fetchTasks, fetchTaskStats]);
  // Only refetch stats when filter changes, not on every task change
  useEffect(() => {
    if (isLoaded && user && tasks.length === 0) {
      // Only fetch stats if we don't have tasks yet (initial load)
      const timeoutId = setTimeout(() => {
        fetchTaskStats();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [filter, isLoaded, user, fetchTaskStats]); // Only depend on filter changes
  // Intersection Observer for infinite scrolling
  const lastTaskElementRef = useCallback(node => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => {
          const nextPage = prevPage + 1;
          // Use current filter from state directly to avoid dependency issues
          const currentFilter = filter;
          fetch(`/api/tugas?page=${nextPage}&limit=10${currentFilter !== 'semua' ? `&filter=${currentFilter}` : ''}`, { credentials: 'include' })
            .then(response => response.json())
            .then(result => {
              if (result.success) {
                setTasks(prevTasks => {
                  const newTasks = [...prevTasks, ...result.tasks];
                  const uniqueTasks = newTasks.filter((task, index, arr) => 
                    arr.findIndex(t => t.id === task.id) === index
                  );
                  return uniqueTasks;
                });
                setHasMore(result.pagination.page < result.pagination.totalPages);
              }
            })
            .catch(err => console.error('Error loading more tasks:', err));
          return nextPage;
        });
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, filter]); // Include filter as dependency since we use it

  // Smart Confetti Effect: Only for newly completed tasks
  useEffect(() => {
    if (!tasks.length) return;
    const completedIds = tasks.filter(t => t.status_submission === 'selesai').map(t => t.id);
    const seen = JSON.parse(localStorage.getItem('seenCompletedTasks') || '[]');
    const newCompleted = completedIds.filter(id => !seen.includes(id));
    if (newCompleted.length > 0) {
      setShowConfetti(true);
      if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
      confettiTimeoutRef.current = setTimeout(() => setShowConfetti(false), 2500);
      // Update localStorage
      localStorage.setItem('seenCompletedTasks', JSON.stringify(completedIds));
    }
  }, [tasks]);  // Since filtering is now done server-side, we don't need client-side filtering
  // Just use the tasks directly from the server
  const filteredTasks = tasks;

  // Use useRef to store stable function references to avoid dependency issues
  const fetchTasksRef = useRef();
  const fetchTaskStatsRef = useRef();
  
  useEffect(() => {
    fetchTasksRef.current = fetchTasks;
    fetchTaskStatsRef.current = fetchTaskStats;
  }, [fetchTasks, fetchTaskStats]);

  // Handle filter change with click on StatCard
  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
    setPage(1); // Reset to first page
    setHasMore(true); // Reset pagination
    setTasks([]); // Clear current tasks
    
    // Use ref to avoid dependency issues
    if (fetchTasksRef.current) {
      fetchTasksRef.current(1, newFilter);
    }
    
    // Refresh stats immediately for real-time feedback
    if (fetchTaskStatsRef.current) {
      fetchTaskStatsRef.current();
    }
  }, []); // No dependencies needed since we use refs

  // Task Button with enhanced auto-refresh stats and real-time optimization
  const handleStartTask = (taskId) => {
    if (!memberId) return;

    // Optimistically update task status immediately for better UX
    setTasks(currentTasks =>
      currentTasks.map(task => {
        if (task.id === taskId) {
          const newDeadline = new Date();
          newDeadline.setHours(newDeadline.getHours() + 4); // Changed to 4 hours
          return {
            ...task,
            status_submission: 'sedang_verifikasi',
            batas_waktu: newDeadline.toISOString(),
          };
        }
        return task;
      })
    );

    // Auto-refresh stats immediately and then again after API call
    fetchTaskStats();

    // Delayed refresh to catch any database triggers
    setTimeout(() => {
      fetchTaskStats();
      // Also refresh the tasks list to ensure consistency
      fetchTasks(1);
    }, 1500);

    //const webhookUrl = `https://n8n.drwapp.com/webhook/4a7f7831-77d7-44d5-8ced-c842bfd479db?memberId=${memberId}&taskId=${taskId}`;
    const webhookUrl = `https://n8n.drwapp.com/webhook/2f2cbb08-6065-4afb-b0f9-5c9fcd8d0c97?memberId=${memberId}&taskId=${taskId}`;
    window.open(webhookUrl, '_blank');
  };
  // Enhanced Countdown Timer with proper timeout API call and responsive design
  const CountdownTimer = ({ deadline, taskId }) => {
    const calculateTimeLeft = useCallback(() => {
      const difference = new Date(deadline) - new Date();
      let timeLeft = {};
      if (difference > 0) {
        timeLeft = {
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return timeLeft;
    }, [deadline]);
    
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [hasNotifiedTimeout, setHasNotifiedTimeout] = useState(false);

    useEffect(() => {
      const timer = setInterval(() => {
        const newTimeLeft = calculateTimeLeft();
        setTimeLeft(newTimeLeft);
        
        // Check if time has run out and we haven't notified yet
        if (newTimeLeft.hours === undefined && !hasNotifiedTimeout) {
          setHasNotifiedTimeout(true);
          
          // Call timeout API to update database
          const handleTimeout = async () => {
            try {
              const response = await fetch('/api/task-submissions/timeout', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ taskId }),
              });

              if (response.ok) {
                // Show timeout notification
                alert('⏰ Waktu tugas telah habis! Task telah ditandai sebagai gagal dan dapat dicoba lagi.');
                
                // Update task status in local state
                setTasks(currentTasks =>
                  currentTasks.map(task => {
                    if (task.id === taskId) {
                      return {
                        ...task,
                        status_submission: 'gagal_diverifikasi',
                        batas_waktu: null,
                      };
                    }
                    return task;
                  })
                );
                
                // Refresh stats and tasks
                setTimeout(() => {
                  fetchTaskStats();
                  fetchTasks(1);
                }, 1000);
              } else {
                console.error('Failed to update timeout status');
              }
            } catch (error) {
              console.error('Error handling timeout:', error);
            }
          };

          handleTimeout();
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }, [calculateTimeLeft, hasNotifiedTimeout, taskId]);

    const formatTime = (value) => value.toString().padStart(2, '0');
    const hasTimeLeft = timeLeft.hours !== undefined;
    
    return (
      <div className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm">
        <span className="font-medium text-gray-600 whitespace-nowrap">Sisa:</span>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1 rounded font-mono flex items-center gap-1">
          {hasTimeLeft ? (
            <>
              <ClockIcon className="w-3 h-3 flex-shrink-0" />
              <span className="whitespace-nowrap">
                {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
              </span>
            </>
          ) : (
            <>
              <ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />
              <span className="text-red-200 font-bold animate-pulse whitespace-nowrap">Habis</span>
            </>
          )}
        </div>
      </div>
    );
  };
  // Task Button
  const renderTaskButton = (task) => {
    switch (task.status_submission) {
      case 'tersedia':
        return (
          <ProfileGatedButton 
            isProfileComplete={isProfileComplete}
            onClick={() => handleStartTask(task.id)} 
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
            tooltip="Lengkapi profil sosial media untuk dapat mengerjakan tugas"
          >
            <PlayCircleIcon className="w-4 h-4" />
            Kerjakan
          </ProfileGatedButton>
        );      case 'sedang_verifikasi':
        return (
          <div className="w-full max-w-xs mx-auto lg:mx-0">
            <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg border border-yellow-300 mb-2">
              <div className="flex items-center justify-center gap-2">
                <ClockIcon className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm whitespace-nowrap">Sedang Verifikasi</span>
              </div>
            </div>
            <CountdownTimer deadline={task.batas_waktu} taskId={task.id} />
          </div>
        );case 'selesai':
        return (
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 max-w-full">
            <div className="flex items-center gap-1 text-green-600 font-semibold">
              <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="text-xs sm:text-sm whitespace-nowrap">Selesai</span>
            </div>            {task.point_value && (
              <EventBoostInlineDisplay
                isActive={isEventActive && isInActivePeriod}
                boostPercentage={boostPercentage}
                pointValue={task.point_value}
                originalValue={task.point_value}
              />
            )}
          </div>
        );
      case 'gagal_diverifikasi':
        return (
          <ProfileGatedButton 
            isProfileComplete={isProfileComplete}
            onClick={() => handleStartTask(task.id)} 
            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors flex items-center gap-2"
            tooltip="Lengkapi profil sosial media untuk dapat mencoba lagi"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Coba Lagi
          </ProfileGatedButton>
        );
      default:
        return null;
    }
  };

  if (loading) return <div className="text-center p-10">Memuat tugas...</div>;
  if (error && !tasks.length) return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  if (!memberId && !loading) return <div className="text-center p-10">Member tidak ditemukan. Mohon lengkapi profil Anda.</div>;
  return (
    <GlassCard className="min-h-screen p-3 sm:p-6 lg:p-8" padding="none">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} width={window.innerWidth} height={window.innerHeight} />}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">Daftar Tugas AI</h1>
      
      {/* Profile Completion Banner */}
      {user && !profileLoading && (
        <ProfileCompletionBanner 
          isComplete={isProfileComplete}
          message={profileMessage}
          socialMediaCount={socialMediaProfiles?.length || 0}
          className="mb-6"
        />
      )}
        {/* Event Boost Banner - Menggunakan komponen yang bisa dikonfigurasi dengan sync database */}
      <EventBoostBanner 
        isActive={isEventActive && isInActivePeriod}
        boostPercentage={boostPercentage}
        pointValue={eventPointValue}
        title={eventTitle}
        description={eventDescription}
        endDate={highestBoostEvent?.end_date}
        isLoading={eventLoading}
      />
      
      {/* Debug Panel - only show when debugTasks=1 */}
      {debugTasks && (
        <GlassCard variant="subtle" className="mb-6 bg-yellow-50 border border-yellow-200">
          <h3 className="text-sm font-bold text-yellow-800 mb-2">🐛 DEBUG MODE</h3>
          <div className="text-xs text-gray-700 space-y-1">
            <div>Total tasks loaded: {tasks.length}</div>
            <div>Member ID: {memberId || 'Not found'}</div>
            {tasks.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-blue-600">Show first task raw data</summary>
                <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(tasks[0], null, 2)}
                </pre>
              </details>
            )}
          </div>
        </GlassCard>
      )}

        {/* Task Statistics - Now Clickable for Filtering */}      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <StatCard 
          title="Total" 
          value={statsLoading ? "..." : taskStats.total}
          textColor="text-indigo-800"
          onClick={() => handleFilterChange('semua')}
          isActive={filter === 'semua'}
        />
        <StatCard 
          title="Selesai" 
          value={statsLoading ? "..." : taskStats.completed}
          textColor="text-green-800"
          onClick={() => handleFilterChange('selesai')}
          isActive={filter === 'selesai'}
        />
        <StatCard 
          title="Belum" 
          value={statsLoading ? "..." : taskStats.incomplete}
          textColor="text-amber-800"
          onClick={() => handleFilterChange('belum')}
          isActive={filter === 'belum'}
        />
        <StatCard 
          title="Verifikasi" 
          value={statsLoading ? "..." : taskStats.verifying}
          textColor="text-orange-800"
          onClick={() => handleFilterChange('verifikasi')}
          isActive={filter === 'verifikasi'}
          tooltip="Tugas yang sedang diverifikasi atau gagal diverifikasi (dengan tombol 'Coba Lagi')"
        />
      </div>{/* Add helpful text for users with active filter indicator */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2">
          {!statsLoading && (
            <button
              onClick={fetchTaskStats}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline order-2 sm:order-1"
            >
              ↻ Refresh
            </button>
          )}
          
          <div className="flex-1 order-1 sm:order-2">
            {filter !== 'semua' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Filter: {
                  filter === 'selesai' ? 'Selesai' : 
                  filter === 'verifikasi' ? 'Verifikasi/Gagal' : 
                  'Belum Selesai'
                }
                <button
                  onClick={() => handleFilterChange('semua')}
                  className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                  title="Reset filter"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        </div>
      </div>      <div className="space-y-3 sm:space-y-4">
        {/* Show filtered count */}
        {filteredTasks.length > 0 && (
          <div className="text-xs sm:text-sm text-gray-500 mb-2">
            Menampilkan {filteredTasks.length} tugas
          </div>
        )}        {filteredTasks.map((task, index) => {
          const isSelesai = task.status_submission === 'selesai';
          return (
            <GlassCard 
              ref={filteredTasks.length === index + 1 ? lastTaskElementRef : undefined} 
              key={`task-${task.id}`}
              variant={isSelesai ? "subtle" : "default"}
              padding="none"
              className={`flex flex-col gap-3 p-4 sm:p-6 lg:p-8 border-l-4 border-indigo-300/50 ${isSelesai ? 'opacity-75' : ''} transition-all duration-300`}
            >
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 lg:gap-6">
                 {/* Content Wrapper */}
                 <div className="flex-1 min-w-0 space-y-2">
                    {/* Header: Title & Time */}
                    <div className="flex justify-between items-start gap-2">
                        <h2 className={`font-bold text-sm sm:text-lg text-gray-800 ${isSelesai ? 'line-through text-gray-500' : ''} line-clamp-2`}>
                          {task.nama_tugas}
                        </h2>
                        {/* Mobile-friendly date */}
                         <span className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5 bg-gray-50 px-2 py-1 rounded">
                          {task.post_timestamp && !isNaN(new Date(task.post_timestamp)) 
                            ? new Date(task.post_timestamp).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) 
                            : ''}
                        </span>
                    </div>

                    {/* Description - Compact */}
                    <p className={`text-gray-600 text-xs sm:text-sm ${isSelesai ? 'line-through' : ''} line-clamp-2 sm:line-clamp-3 leading-relaxed`}>
                      {task.deskripsi_tugas}
                    </p>

                    {/* Metadata & Actions */}
                     <div className="flex flex-wrap items-center gap-2 mt-1">
                        {/* Point Badge */}
                        {task.point_value && (
                            <div className="scale-90 origin-left sm:scale-100">
                                <EventBoostTableDisplay
                                  isActive={isEventActive && isInActivePeriod}
                                  boostPercentage={boostPercentage}
                                  pointValue={task.point_value}
                                  originalValue={task.point_value}
                                />
                            </div>
                        )}
                        
                        {/* Keyword Badge (if exists) */}
                        {task.keyword_tugas && task.keyword_tugas !== 'null' && (
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700">
                                KEY: {task.keyword_tugas}
                             </span>
                        )}

                        <div className="flex items-center gap-3 ml-auto sm:ml-0">
                           {/* Link Postingan */}
                            {task.link_postingan && (
                                <a 
                                  href={task.link_postingan}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                  title="Lihat Postingan"
                                >
                                  <ShareIcon className="w-4 h-4" />
                                </a>
                            )}
                            
                            {/* Detail Tugas */}
                            <button 
                                onClick={() => router.push(`/tugas/${task.id}`)}
                                className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                title="Lihat Detail"
                            >
                                <EyeIcon className="w-4 h-4" />
                            </button>
                        </div>
                     </div>
                 </div>

                 {/* Action Button - Full width on mobile, auto on desktop */}
                 <div className="w-full lg:w-auto lg:min-w-[180px] pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 lg:border-none flex justify-end lg:justify-end items-center">
                    {renderTaskButton(task)}
                 </div>
              </div>
            </GlassCard>
          );
        })}
        {loadingMore && <div className="text-center p-4">Memuat lebih banyak tugas...</div>}
        {!hasMore && filteredTasks.length > 0 && (
          <div className="text-center p-4 text-gray-500">Anda telah mencapai akhir daftar.</div>
        )}        {!loading && !filteredTasks.length && (
          <p>Tidak ada tugas yang tersedia saat ini.</p>
        )}
      </div>
    </GlassCard>
  );
}
