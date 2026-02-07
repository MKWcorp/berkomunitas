'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { useParams, useRouter } from 'next/navigation';
import Confetti from 'react-confetti';
import { ArrowLeftIcon, ShareIcon, PlayCircleIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon, TrophyIcon, TrashIcon } from '@heroicons/react/24/outline';
import GlassCard from '../../components/GlassCard';
import ProfileGatedButton from '../../../components/ProfileGatedButton';
import { EventBoostCompletionDisplay, EventBoostRewardDisplay } from '../../../components/EventBoostComponents';
import { useMultipleEventBoost } from '../../../hooks/useMultipleEventBoost';
import { useMainEventBoost } from '../../../hooks/useEventBoost';
import { useProfileCompletion } from '../../../hooks/useProfileCompletion';
import { useAdminStatus } from '../../../hooks/useAdminStatus';

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

// Helper function for background color
function _getSourceBgColor(source) {
  if (!source) {
    return SOURCE_BG_COLORS.default;
  }
  return SOURCE_BG_COLORS[source] || SOURCE_BG_COLORS.default;
}

export default function TaskDetailPage() {
  const { user, isLoaded, isSignedIn } = useSSOUser();
  const { id } = useParams();
  const router = useRouter();
  // Profile completion check
  const { isComplete: isProfileComplete, loading: profileLoading, message: _profileMessage } = useProfileCompletion();
  
  // Admin status check
  const { isAdmin, loading: _adminLoading } = useAdminStatus();
  
  // Event boost configuration - menggunakan multiple event system
  const { 
    activeEvents, 
    hasActiveEvents,
    highestBoostEvent
  } = useMultipleEventBoost();

  // Fallback using main event hook
  const { isEventActive: fallbackActive, boostPercentage: fallbackBoost } = useMainEventBoost();

  const isEventActive = hasActiveEvents || fallbackActive;
  const boostPercentage = highestBoostEvent?.boostPercentage || fallbackBoost || 200;
  
  const [task, setTask] = useState(null);
  const [memberId, setMemberId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const confettiTimeoutRef = useRef();

  // Fetch public task details
  const fetchPublicTask = useCallback(async () => {
    try {
      const response = await fetch(`/api/tugas/${id}`);
      if (!response.ok) {
        throw new Error('Task not found');
      }
      const result = await response.json();
      if (result.success) {
        setTask(result.task);
      } else {
        throw new Error(result.error || 'Failed to fetch task');
      }
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  // Fetch user-specific task details
  const fetchUserTask = useCallback(async (userMemberId) => {
    try {
      const response = await fetch(`/api/tugas/${id}?memberId=${userMemberId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user task data');
      }
      const result = await response.json();
      if (result.success) {
        setTask(result.task);
      } else {
        throw new Error(result.error || 'Failed to fetch user task data');
      }
    } catch (err) {
      console.error('Error fetching user task data:', err);
      // Don't set error here, keep the public task data
    }
  }, [id]);

  // Get member ID from user metadata
  const getMemberIdFromUser = useCallback(async () => {
    if (!user) return null;
      try {
      const response = await fetch('/api/create-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_id: user.id,
          email: user.email,
          display_name: user.name || user.email?.split('@')[0] || 'Unknown'
        }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.member?.id || null;
      }
    } catch (err) {
      console.error('Error getting member ID:', err);
    }
    return null;
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      setLoading(true);
      
      // Always fetch public task data first
      await fetchPublicTask();
      
      // If user is loaded and signed in, get user-specific data
      if (isLoaded && isSignedIn && user) {
        const userMemberId = await getMemberIdFromUser();
        if (userMemberId) {
          setMemberId(userMemberId);
          await fetchUserTask(userMemberId);
        }
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [id, isLoaded, isSignedIn, user, fetchPublicTask, fetchUserTask, getMemberIdFromUser]);

  // Confetti effect for completed tasks
  useEffect(() => {
    if (task?.status_submission === 'selesai' && isSignedIn) {
      const taskCompletedKey = `task_${id}_completed_seen`;
      const hasSeenConfetti = localStorage.getItem(taskCompletedKey);
      
      if (!hasSeenConfetti) {
        setShowConfetti(true);
        if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
        confettiTimeoutRef.current = setTimeout(() => setShowConfetti(false), 3000);
        localStorage.setItem(taskCompletedKey, 'true');
      }
    }
  }, [task?.status_submission, id, isSignedIn]);

  // Handle task start for logged-in users
  const handleStartTask = useCallback(() => {
    if (!isSignedIn) {
      // Show message and redirect to sign-in
      setShareMessage('Silakan login terlebih dahulu untuk mengerjakan tugas');
      setTimeout(() => {
        router.push('/sign-in');
      }, 1500);
      return;
    }

    if (!isProfileComplete) {
      // Show message and redirect to profile completion
      setShareMessage('Lengkapi profil sosial media Anda terlebih dahulu');
      setTimeout(() => {
        router.push('/profil?tab=sosial&complete=true');
      }, 1500);
      return;
    }

    if (!memberId || !task) return;

    // Update task status optimistically
    setTask(prevTask => {
      const newDeadline = new Date();
      newDeadline.setHours(newDeadline.getHours() + 4);
      return {
        ...prevTask,
        status_submission: 'sedang_verifikasi',
        batas_waktu: newDeadline.toISOString(),
      };
    });

    // Open webhook URL
    const webhookUrl = `https://n8n.drwapp.com/webhook/2f2cbb08-6065-4afb-b0f9-5c9fcd8d0c97?memberId=${memberId}&taskId=${id}`;
    window.open(webhookUrl, '_blank');
  }, [isSignedIn, isProfileComplete, memberId, task, id, router]);

  // Handle share functionality
  const handleShare = useCallback(async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      setShareMessage('Link berhasil disalin ke clipboard!');
      setTimeout(() => setShareMessage(''), 3000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setShareMessage('Gagal menyalin link');
      setTimeout(() => setShareMessage(''), 3000);
    }
  }, []);

  // Handle delete task (admin only)
  const handleDeleteTask = useCallback(async () => {
    if (!isAdmin) {
      setShareMessage('Anda tidak memiliki akses untuk menghapus tugas');
      setTimeout(() => setShareMessage(''), 3000);
      return;
    }

    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus tugas "${task?.nama_tugas}"?\n\nTindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait tugas ini.`
    );
    
    if (!confirmDelete) return;

    setDeleteLoading(true);
    try {
      // First attempt without force
      let response = await fetch(`/api/admin/tugas/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      let result = await response.json();
      
      // If has submissions, ask for confirmation to force delete
      if (!response.ok && result.hasSubmissions) {
        const forceConfirm = window.confirm(
          `${result.message}\n\nApakah Anda ingin melanjutkan menghapus tugas beserta ${result.submissionCount} submission yang ada?\n\nTindakan ini tidak dapat dibatalkan!`
        );
        
        if (forceConfirm) {
          // Force delete with submissions
          response = await fetch(`/api/admin/tugas/${id}?force=true`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          result = await response.json();
        } else {
          setDeleteLoading(false);
          return;
        }
      }
      
      if (response.ok && result.success) {
        setShareMessage(result.message + ' Mengalihkan ke daftar tugas...');
        setTimeout(() => {
          router.push('/tugas');
        }, 2000);
      } else {
        throw new Error(result.error || 'Gagal menghapus tugas');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setShareMessage(`Error: ${err.message}`);
      setTimeout(() => setShareMessage(''), 5000);
    } finally {
      setDeleteLoading(false);
    }
  }, [isAdmin, task, id, router]);
  // Countdown Timer Component with responsive design
  const CountdownTimer = ({ deadline }) => {
    const [timeLeft, setTimeLeft] = useState({});

    useEffect(() => {
      const calculateTimeLeft = () => {
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
      };

      setTimeLeft(calculateTimeLeft());
      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft());
      }, 1000);

      return () => clearInterval(timer);
    }, [deadline]);

    const formatTime = (value) => value.toString().padStart(2, '0');
    const hasTimeLeft = timeLeft.hours !== undefined;

    return (
      <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
        <span className="text-xs sm:text-sm font-medium text-gray-600">Sisa Waktu:</span>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 sm:px-3 py-1 rounded-lg font-mono text-xs sm:text-sm">
          {hasTimeLeft ? (
            <span className="flex items-center gap-1">
              <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
            </span>
          ) : (
            <span className="text-red-200 font-bold animate-pulse flex items-center gap-1">
              <ExclamationTriangleIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              Waktu Habis
            </span>
          )}
        </div>
      </div>
    );
  };

  // Render task button based on status and auth state
  const renderTaskButton = () => {
    if (!isSignedIn) {
      return (
        <button 
          onClick={handleStartTask}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
        >
          <PlayCircleIcon className="w-5 h-5" />
          Kerjakan Tugas
        </button>
      );
    }

    if (!task) return null;

    switch (task.status_submission) {
      case 'tersedia':
        return (
          <ProfileGatedButton
            isProfileComplete={isProfileComplete}
            onClick={handleStartTask}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
            tooltip="Lengkapi profil sosial media untuk mengerjakan tugas"
          >
            <PlayCircleIcon className="w-5 h-5" />
            Kerjakan
          </ProfileGatedButton>
        );
      case 'sedang_verifikasi':
        return (
          <div className="text-center">
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg flex items-center justify-center gap-2">
              <ClockIcon className="w-5 h-5" />
              Sedang Diverifikasi
            </div>
            {task.batas_waktu && (
              <div className="mt-2">
                <CountdownTimer deadline={task.batas_waktu} />
              </div>
            )}
          </div>
        );      case 'selesai':
        return (
          <div className="w-full max-w-xs mx-auto">
            <div className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-3 sm:px-4 py-2 rounded-lg font-medium border border-green-300 shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <span className="font-bold text-sm sm:text-base">Selesai</span>
              </div>              {task.point_value && (
                <div className="flex items-center justify-center gap-1 text-xs sm:text-sm">
                  <TrophyIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-yellow-600" />
                  <span className="font-semibold text-green-700">+{task.point_value} Poin Diperoleh</span>
                  <EventBoostCompletionDisplay 
                    isActive={isEventActive}
                    boostPercentage={boostPercentage}
                  />
                </div>
              )}
            </div>
          </div>
        );
      case 'gagal_diverifikasi':
        return (
          <ProfileGatedButton
            isProfileComplete={isProfileComplete}
            onClick={handleStartTask}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors font-medium flex items-center gap-2"
            tooltip="Lengkapi profil sosial media untuk mencoba lagi"
          >
            <ExclamationTriangleIcon className="w-5 h-5" />
            Coba Lagi
          </ProfileGatedButton>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="container mx-auto max-w-4xl">
          <GlassCard className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat detail tugas...</p>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="container mx-auto max-w-4xl">
          <GlassCard className="text-center">
            <div className="flex items-center justify-center mb-4">
              <ExclamationTriangleIcon className="w-16 h-16 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Tugas Tidak Ditemukan</h2>
            <p className="text-red-600 mb-4">{error || 'Tugas yang Anda cari tidak tersedia'}</p>
            <button 
              onClick={() => router.push('/tugas')}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 inline mr-2" />
              Kembali ke Daftar Tugas
            </button>
          </GlassCard>
        </div>
      </div>
    );
  }

  const isCompleted = task.status_submission === 'selesai';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 sm:p-6 pb-20">
      <div className="max-w-xl mx-auto space-y-3 sm:space-y-4">
        {showConfetti && (
          <Confetti numberOfPieces={120} recycle={false} width={window.innerWidth} height={window.innerHeight} />
        )}
        
        {/* Share Message Toast */}
        {shareMessage && (
          <GlassCard variant="subtle" className="text-center py-2 px-4 fixed top-4 left-1/2 transform -translate-x-1/2 z-50 shadow-lg bg-green-50 border border-green-200">
            <p className="text-xs sm:text-sm text-green-800 font-medium">{shareMessage}</p>
          </GlassCard>
        )}

        {/* Task Detail Card */}
        <GlassCard className={`relative overflow-hidden ${isCompleted ? 'opacity-80' : ''}`} padding="none">
          <div className="p-4 sm:p-6">
            {/* Header: Title & Actions */}
            <div className="flex justify-between items-start gap-3 mb-3">
              <h1 className={`text-lg sm:text-xl font-bold text-gray-800 leading-tight ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                {task.nama_tugas}
              </h1>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                 {/* Share Button */}
                <button 
                  onClick={handleShare} 
                  className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                  title="Bagikan Task Ini"
                >
                  <ShareIcon className="w-5 h-5" />
                </button>

                {/* Admin Delete Button */}
                {isAdmin && (
                  <button 
                    onClick={handleDeleteTask}
                    disabled={deleteLoading}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                  >
                    {deleteLoading ? (
                      <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <TrashIcon className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>
            </div>
            
            {/* Metadata Grid (Compact) */}
            <div className="flex flex-wrap gap-2 mb-4 text-xs text-gray-600 border-b border-gray-100 pb-3">
               {/* Time */}
               {task.post_timestamp && !isNaN(new Date(task.post_timestamp)) && (
                 <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                   <ClockIcon className="w-3.5 h-3.5" />
                   <span>{new Date(task.post_timestamp).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: '2-digit'})}</span>
                 </div>
               )}
               
               {/* Keyword */}
               <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded max-w-full">
                  <span className="font-semibold text-gray-500 whitespace-nowrap">Key:</span>
                  <span className="font-mono text-gray-700 break-all">
                    {task.keyword_tugas && task.keyword_tugas !== 'null' ? task.keyword_tugas : '-'}
                  </span>
               </div>

                {/* Reward */}
               {task.point_value && (
                <div className="flex items-center gap-1 bg-yellow-50 text-yellow-800 px-2 py-1 rounded ml-auto">
                    <TrophyIcon className="w-3.5 h-3.5" />
                    <span className="font-bold">+{task.point_value}</span>
                    <div className="scale-75 origin-left">
                        <EventBoostRewardDisplay 
                          isActive={isEventActive}
                          boostPercentage={boostPercentage}
                        />
                    </div>
                </div>
               )}
            </div>

            {/* Description */}
            <div className="mb-4">
              <div className={`text-sm text-gray-600 leading-relaxed ${isCompleted ? 'line-through opacity-70' : ''}`}>
                {task.deskripsi_tugas}
              </div>
            </div>

            {/* Link Postingan Button (Full Width) */}
            {task.link_postingan && (
              <a 
                href={task.link_postingan}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full p-2.5 mb-4 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
                Buka Postingan Asli
              </a>
            )}

            {/* Main Action Button */}
            <div className="flex justify-center w-full">
              <div className="w-full">
                {renderTaskButton()}
              </div>
            </div>

            {/* Helper Texts */}
            {!isSignedIn && (
                <p className="mt-3 text-center text-xs text-gray-400">
                Login untuk mulai mengerjakan
                </p>
            )}
          </div>
        </GlassCard>

        {/* Completed Members List (Mobile First) */}
        {Array.isArray(task?.completed_members) && task.completed_members.length > 0 && (
          <GlassCard className="flex-1 flex flex-col min-h-0" padding="none">
             <div className="p-3 sm:p-4 border-b border-gray-100 flex justify-between items-center bg-white/40">
                <h3 className="text-sm sm:text-base font-bold text-gray-700 flex items-center gap-2">
                  <TrophyIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                  Selesai ({task.completed_members.length})
                </h3>
             </div>
             
             <div className="max-h-[40vh] overflow-y-auto p-0 sm:p-2 custom-scrollbar">
                {task.completed_members.map((member, idx) => (
                    <div key={member.id || idx} className="flex items-center gap-3 p-3 border-b last:border-0 border-gray-50 hover:bg-white/30 transition-colors">
                        <span className="text-xs font-mono text-gray-400 w-5 flex-shrink-0">{idx + 1}</span>
                        
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                           {member.foto_profil_url ? (
                                <img 
                                src={member.foto_profil_url} 
                                alt="" 
                                className="w-8 h-8 rounded-full object-cover border border-white shadow-sm" 
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                    {member.display_name?.charAt(0) || '?'}
                                </div>
                            )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                                {member.display_name || 'Member'}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">
                                @{member.username || '-'} • <span className="text-green-600">
                                  {member.tanggal_selesai && !isNaN(new Date(member.tanggal_selesai)) 
                                    ? new Date(member.tanggal_selesai).toLocaleDateString('id-ID', {day:'numeric', month:'short'})
                                    : 'Selesai'}
                                </span>
                            </p>
                        </div>
                        
                        {/* Points Badge */}
                        <div className="flex-shrink-0 flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100">
                             <TrophyIcon className="w-3 h-3 text-yellow-600" />
                             <span className="text-xs font-bold text-yellow-700">{member.loyalty_point ?? 0}</span>
                        </div>
                    </div>
                ))}
             </div>
          </GlassCard>
        )}

      </div>
    </div>
  );
}
