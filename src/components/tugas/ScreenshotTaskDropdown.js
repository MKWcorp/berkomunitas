/**
 * ScreenshotTaskDropdown
 *
 * Expandable dropdown for screenshot-type tasks (TikTok, Facebook).
 * Flow: expand card → klik "Kerjakan" → link terbuka + form aktif → upload screenshot
 *
 * Props:
 *   task            - task object from /api/tugas (task_type === 'screenshot')
 *   onSuccess       - callback setelah screenshot berhasil diupload
 */
'use client';
import { useState, useCallback } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
  CameraIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlayCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// Platform label + colors
const PLATFORM_META = {
  tiktok:    { label: 'TikTok',    color: 'bg-black text-white',          dot: 'bg-white' },
  facebook:  { label: 'Facebook',  color: 'bg-blue-600 text-white',        dot: 'bg-white' },
  instagram: { label: 'Instagram', color: 'bg-pink-500 text-white',        dot: 'bg-white' },
  default:   { label: 'Social',    color: 'bg-gray-600 text-white',        dot: 'bg-white' },
};

function PlatformBadge({ source }) {
  const meta = PLATFORM_META[source?.toLowerCase()] ?? PLATFORM_META.default;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${meta.color}`}>
      {meta.label}
    </span>
  );
}

// Status pill for the collapsed card header
function StatusPill({ status }) {
  switch (status) {
    case 'selesai':
      return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircleIcon className="w-3.5 h-3.5" /> Selesai</span>;
    case 'sedang_verifikasi':
    case 'menunggu_screenshot':
      return <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-600"><ClockIcon className="w-3.5 h-3.5 animate-pulse" /> Verifikasi</span>;
    case 'gagal':
    case 'gagal_diverifikasi':
      return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600"><ExclamationTriangleIcon className="w-3.5 h-3.5" /> Gagal</span>;
    case 'dikerjakan':
      return <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600"><PlayCircleIcon className="w-3.5 h-3.5" /> Dikerjakan</span>;
    case 'expired':
      return <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400"><XMarkIcon className="w-3.5 h-3.5" /> Expired</span>;
    default:
      return <span className="text-xs text-gray-400">Tersedia</span>;
  }
}

// Countdown string from batas_waktu
function useCountdown(batas_waktu) {
  if (!batas_waktu) return null;
  const diff = new Date(batas_waktu) - Date.now();
  if (diff <= 0) return 'Waktu habis';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return `${h}j ${m}m tersisa`;
}

export default function ScreenshotTaskDropdown({ task, onSuccess }) {
  const [expanded, setExpanded]         = useState(false);
  const [submitting, setSubmitting]     = useState(false); // kerjakan button loading
  const [uploading, setUploading]       = useState(false); // screenshot upload loading
  const [error, setError]               = useState('');
  const [successMsg, setSuccessMsg]     = useState('');

  // Derived from task (refreshed via onSuccess → parent re-fetches)
  const submission  = task.submission_data;
  const screenshot  = task.screenshot_data;
  const status      = task.status_submission ?? 'tersedia';

  // Has user clicked "Kerjakan"? → gate for upload form
  const hasStarted  = submission != null && !['expired'].includes(submission.status);
  const canUpload   = hasStarted && !['selesai', 'sedang_verifikasi', 'menunggu_screenshot'].includes(status);
  const deadline    = useCountdown(submission?.batas_waktu);

  // ── Kerjakan ──────────────────────────────────────────────────────────
  const handleKerjakan = useCallback(async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tugas-ai-2/${task.id}/kerjakan`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message ?? 'Gagal memulai tugas');
        return;
      }

      // Open post link in new tab
      if (data.link_postingan) {
        window.open(data.link_postingan, '_blank', 'noopener,noreferrer');
      }

      // Refresh parent task list so submission_data contains new record
      if (onSuccess) onSuccess();

    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }, [task.id, onSuccess]);

  // ── Upload screenshot ─────────────────────────────────────────────────
  const handleUpload = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const form = e.target;
    const file = form.screenshot.files[0];
    const commentLink = form.comment_link?.value ?? '';

    if (!file) { setError('Pilih file screenshot terlebih dahulu'); return; }

    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Ukuran file maksimal ${MAX_MB}MB`);
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('screenshot', file);
      fd.append('comment_link', commentLink);

      const res = await fetch(`/api/tugas/${task.id}/screenshot`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message ?? 'Upload gagal');
        return;
      }

      setSuccessMsg('Screenshot berhasil diupload! Sedang diverifikasi...');
      if (onSuccess) onSuccess();

    } catch {
      setError('Upload gagal. Coba lagi.');
    } finally {
      setUploading(false);
    }
  }, [task.id, onSuccess]);

  const isFinished = status === 'selesai';
  const isVerifying = status === 'sedang_verifikasi';

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">

      {/* ── Collapsed header ── */}
      <button
        className="w-full text-left px-5 py-4 flex items-start gap-3"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Point badge */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <span className="text-blue-600 font-bold text-sm">{task.point_value ?? 10}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <PlatformBadge source={task.source} />
            <StatusPill status={status} />
          </div>
          <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
            {task.deskripsi_tugas ?? 'Tugas Screenshot'}
          </p>
          {task.keyword_tugas && (
            <p className="text-xs text-gray-400 mt-0.5">Keyword: <span className="text-gray-600 font-medium">{task.keyword_tugas}</span></p>
          )}
        </div>

        <div className="flex-shrink-0 mt-0.5">
          {expanded
            ? <ChevronUpIcon className="w-4 h-4 text-gray-400" />
            : <ChevronDownIcon className="w-4 h-4 text-gray-400" />
          }
        </div>
      </button>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-gray-50">

          {/* Already finished */}
          {isFinished && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-xl px-4 py-3 text-sm font-medium">
              <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
              Tugas selesai! Poin telah dikreditkan.
            </div>
          )}

          {/* Being verified */}
          {isVerifying && !isFinished && (
            <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 rounded-xl px-4 py-3 text-sm">
              <ClockIcon className="w-5 h-5 flex-shrink-0 animate-pulse" />
              <div>
                <p className="font-medium">Screenshot sedang diverifikasi</p>
                {screenshot?.uploaded_at && (
                  <p className="text-xs text-yellow-600 mt-0.5">
                    Diupload {new Date(screenshot.uploaded_at).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Active submission info */}
          {hasStarted && !isFinished && !isVerifying && deadline && (
            <div className="flex items-center gap-2 text-blue-700 bg-blue-50 rounded-xl px-4 py-2 text-xs">
              <ClockIcon className="w-4 h-4 flex-shrink-0" />
              Batas waktu upload: <span className="font-semibold ml-1">{deadline}</span>
            </div>
          )}

          {/* Instructions */}
          {!isFinished && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cara mengerjakan</p>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Klik tombol <strong>Kerjakan</strong> — halaman postingan akan terbuka</li>
                <li>Tinggalkan komentar yang mengandung kata: <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-mono text-xs">{task.keyword_tugas ?? '...'}</span></li>
                <li>Screenshot bukti komentar kamu</li>
                <li>Upload screenshot di form di bawah</li>
              </ol>
            </div>
          )}

          {/* Kerjakan button */}
          {!isFinished && !isVerifying && (
            <button
              onClick={handleKerjakan}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              {submitting ? 'Membuka...' : hasStarted ? 'Buka Postingan Lagi' : 'Kerjakan'}
            </button>
          )}

          {/* Screenshot upload form — only visible after Kerjakan */}
          {hasStarted && !isFinished && !isVerifying && (
            <form onSubmit={handleUpload} className="space-y-3 pt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Upload Bukti Screenshot</p>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Screenshot komentar <span className="text-red-500">*</span>
                </label>
                <input
                  name="screenshot"
                  type="file"
                  accept="image/*"
                  required
                  className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-200 rounded-xl px-3 py-2"
                />
                <p className="text-xs text-gray-400 mt-1">Maks. 10MB · JPG, PNG, WEBP</p>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Link komentar <span className="text-gray-400">(opsional)</span>
                </label>
                <input
                  name="comment_link"
                  type="url"
                  placeholder="https://..."
                  className="block w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
              {successMsg && (
                <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">{successMsg}</p>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <CameraIcon className="w-4 h-4" />
                {uploading ? 'Mengupload...' : 'Kirim Screenshot'}
              </button>
            </form>
          )}

          {/* Locked upload hint — before Kerjakan clicked */}
          {!hasStarted && !isFinished && (
            <div className="flex items-center gap-2 text-gray-400 bg-gray-100 rounded-xl px-4 py-3 text-xs">
              <CameraIcon className="w-4 h-4 flex-shrink-0" />
              Form upload screenshot akan aktif setelah kamu klik tombol <strong className="ml-1">Kerjakan</strong>
            </div>
          )}

          {error && !hasStarted && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

        </div>
      )}
    </div>
  );
}
