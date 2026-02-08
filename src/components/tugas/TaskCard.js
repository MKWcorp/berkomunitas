/**
 * TaskCard Component
 * Displays individual task with different UI for auto-verify vs screenshot tasks
 */
'use client';
import { useState } from 'react';
import GlassCard from '../../app/components/GlassCard';
import ProfileGatedButton from '../ProfileGatedButton';
import { EventBoostTableDisplay } from '../EventBoostComponents';
import ScreenshotUploadForm from './ScreenshotUploadForm';
import { 
  PlayCircleIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  CameraIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/solid';
import { ShareIcon, EyeIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

// Source background colors mapping
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

function getSourceBgColor(source) {
  if (!source) return SOURCE_BG_COLORS.default;
  return SOURCE_BG_COLORS[source] || SOURCE_BG_COLORS.default;
}

export default function TaskCard({
  task,
  isProfileComplete,
  activeEvents,
  highestBoostEvent,
  onTaskAction,
  onScreenshotSubmit,
  formatInstagramLink,
  router,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'selesai': return 'text-green-600';
      case 'sedang_verifikasi': return 'text-yellow-600';
      case 'gagal_diverifikasi': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'selesai': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'sedang_verifikasi': return <ClockIcon className="h-5 w-5 text-yellow-500 animate-pulse" />;
      case 'gagal_diverifikasi': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default: return <PlayCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getButtonText = (status, taskType) => {
    if (taskType === 'screenshot') {
      switch (status) {
        case 'selesai': return 'Selesai';
        case 'sedang_verifikasi': return 'Verifikasi...';
        case 'gagal_diverifikasi': return 'Upload Ulang';
        default: return 'Upload Screenshot';
      }
    } else {
      switch (status) {
        case 'selesai': return 'Selesai';
        case 'sedang_verifikasi': return 'Verifikasi...';
        case 'gagal_diverifikasi': return 'Kerjakan Ulang';
        default: return 'Kerjakan';
      }
    }
  };

  const isButtonDisabled = (status) => {
    return status === 'selesai' || status === 'sedang_verifikasi';
  };

  // Calculate boosted points
  const basePoints = task.point_value || 10;
  const boostPercentage = highestBoostEvent?.boostPercentage || 100;
  const boostedPoints = Math.floor((basePoints * boostPercentage) / 100);
  const hasBoost = activeEvents?.length > 0 && boostPercentage > 100;

  const handleUploadFormSubmit = async (formData) => {
    await onScreenshotSubmit(formData);
    setShowUploadForm(false);
  };

  const handleButtonClick = () => {
    if (task.task_type === 'screenshot') {
      if (task.status_submission === 'tersedia' || task.status_submission === 'gagal_diverifikasi') {
        setShowUploadForm(!showUploadForm);
      }
    } else {
      onTaskAction(task);
    }
  };

  // Debug: Log task data to see if verification_rules exists
  if (task.task_type === 'screenshot' && !task.keyword_tugas) {
    console.log('Screenshot Task Data:', {
      id: task.id,
      keyword_tugas: task.keyword_tugas,
      verification_rules: task.verification_rules,
      deskripsi_tugas: task.deskripsi_tugas
    });
  }

  return (
    <GlassCard variant="default" padding="lg" hover className="mb-4">
      <div className="flex flex-col gap-3">
        {/* Main Content */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
          {/* Left: Task Info */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2 mb-2">
              {/* Status Icon */}
              {getStatusIcon(task.status_submission)}
              
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">Keyword:</div>
                <h3 className={`text-base sm:text-lg font-semibold ${getStatusColor(task.status_submission)} truncate`}>
                  {task.task_type === 'screenshot' 
                    ? (task.verification_rules?.required_keywords?.length > 0 
                        ? task.verification_rules.required_keywords.join(', ')
                        : task.keyword_tugas || task.deskripsi_tugas || 'Tugas AI')
                    : (task.keyword_tugas || task.deskripsi_tugas || 'Tugas AI')
                  }
                </h3>
              </div>
            </div>

            {/* Description - only for non-screenshot tasks */}
            {task.deskripsi_tugas && task.task_type !== 'screenshot' && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {task.deskripsi_tugas}
              </p>
            )}

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
              {/* Points Display */}
              <div className="flex items-center gap-1 text-gray-700">
                <span className="font-medium">
                  {hasBoost ? (
                    <>
                      <span className="line-through text-gray-400">{basePoints}</span>
                      <span className="ml-1 text-green-600 font-bold">{boostedPoints}</span>
                    </>
                  ) : (
                    <span>{basePoints}</span>
                  )}
                </span>
                <span>poin</span>
              </div>

              {/* Event Boost Badge */}
              {hasBoost && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  Boost {boostPercentage}%
                </span>
              )}

              {/* Action Icons */}
              <div className="flex items-center gap-2 ml-auto">
                {/* View Post Button */}
                {task.link_postingan && (
                  <a
                    href={formatInstagramLink(task.link_postingan)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Lihat Postingan"
                  >
                    <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-600" />
                  </a>
                )}
                
                {/* Share Button */}
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/tugas/${task.id}?type=${task.task_type}`;
                    navigator.clipboard.writeText(url);
                    alert('Link tugas berhasil disalin!');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Share Tugas"
                >
                  <ShareIcon className="h-5 w-5 text-gray-600" />
                </button>
                
                {/* Detail Button */}
                <button
                  onClick={() => router.push(`/tugas/${task.id}?type=${task.task_type}`)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Lihat Detail"
                >
                  <EyeIcon className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Deadline if verifying */}
            {task.batas_waktu && task.status_submission === 'sedang_verifikasi' && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                Batas: {new Date(task.batas_waktu).toLocaleString('id-ID')}
              </p>
            )}

            {/* Screenshot Data if exists */}
            {task.screenshot_data && task.task_type === 'screenshot' && (
              <div className="mt-3">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CameraIcon className="h-5 w-5 text-purple-600" />
                    <div className="text-left">
                      <p className="text-sm text-purple-800 font-medium">
                        Screenshot sudah diupload
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(task.screenshot_data.uploaded_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUpIcon className="h-5 w-5 text-purple-600" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-purple-600" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        task.screenshot_data.status === 'selesai' ? 'bg-green-100 text-green-700' :
                        task.screenshot_data.status === 'sedang_verifikasi' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {task.screenshot_data.status === 'selesai' && <CheckCircleIcon className="h-4 w-4" />}
                        {task.screenshot_data.status === 'sedang_verifikasi' && <ClockIcon className="h-4 w-4" />}
                        {task.screenshot_data.status === 'gagal_diverifikasi' && <ExclamationTriangleIcon className="h-4 w-4" />}
                        {task.screenshot_data.status === 'selesai' ? 'Terverifikasi' :
                         task.screenshot_data.status === 'sedang_verifikasi' ? 'Menunggu Verifikasi' :
                         'Gagal Diverifikasi'}
                      </span>
                    </div>
                    
                    <a
                      href={task.screenshot_data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={task.screenshot_data.url}
                        alt="Screenshot Tugas"
                        className="w-full rounded-lg border border-gray-300 hover:border-purple-400 transition-colors cursor-pointer"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-48 bg-gray-100 rounded-lg border border-gray-300 items-center justify-center">
                        <p className="text-sm text-gray-500">Gambar tidak dapat dimuat</p>
                      </div>
                    </a>
                    
                    <a
                      href={task.screenshot_data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                    >
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      Buka Ukuran Penuh
                    </a>
                    
                    {task.screenshot_data.status === 'gagal_diverifikasi' && task.screenshot_data.admin_notes && (
                      <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                        <p className="text-xs font-medium text-red-800 mb-1">Catatan Admin:</p>
                        <p className="text-xs text-red-700">{task.screenshot_data.admin_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Action Button */}
          <div className="w-full sm:w-auto sm:min-w-[160px]">
            <ProfileGatedButton
              isProfileComplete={isProfileComplete}
              onClick={handleButtonClick}
              className={`w-full px-4 py-2.5 rounded-full font-medium transition-all duration-200 flex items-center justify-center gap-2 border ${
                isButtonDisabled(task.status_submission)
                  ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
              disabled={isButtonDisabled(task.status_submission)}
            >
              {task.task_type === 'screenshot' && showUploadForm ? (
                <>
                  <ChevronUpIcon className="h-5 w-5" />
                  <span>Tutup</span>
                </>
              ) : (
                <>
                  {task.task_type === 'screenshot' ? (
                    <CameraIcon className="h-5 w-5" />
                  ) : (
                    <PlayCircleIcon className="h-5 w-5" />
                  )}
                  <span>{getButtonText(task.status_submission, task.task_type)}</span>
                </>
              )}
            </ProfileGatedButton>
          </div>
        </div>

        {/* Expandable Upload Form for Screenshot Tasks */}
        {showUploadForm && task.task_type === 'screenshot' && (
          <ScreenshotUploadForm
            task={task}
            onSubmit={handleUploadFormSubmit}
            onCancel={() => setShowUploadForm(false)}
          />
        )}
      </div>
    </GlassCard>
  );
}
