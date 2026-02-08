/**
 * ScreenshotUploadModal Component
 * Modal untuk upload screenshot dan link komentar untuk tugas_ai_2
 */
'use client';
import { useState, useRef } from 'react';
import { XMarkIcon, PhotoIcon, LinkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import GlassCard from '../../app/components/GlassCard';

export default function ScreenshotUploadModal({ 
  isOpen, 
  onClose, 
  task, 
  onSubmit 
}) {
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [commentLink, setCommentLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, dll)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB');
      return;
    }

    setError('');
    setScreenshot(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!screenshot) {
      setError('Screenshot wajib diupload');
      return;
    }

    if (!commentLink.trim()) {
      setError('Link komentar wajib diisi');
      return;
    }

    // Validate Instagram link
    if (!commentLink.includes('instagram.com')) {
      setError('Link harus berupa link Instagram');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('screenshot', screenshot);
      formData.append('comment_link', commentLink);
      formData.append('task_id', task.id);

      await onSubmit(formData);
      
      // Reset form
      setScreenshot(null);
      setScreenshotPreview(null);
      setCommentLink('');
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal mengupload screenshot');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setScreenshot(null);
      setScreenshotPreview(null);
      setCommentLink('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <GlassCard 
        variant="strong" 
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Upload Screenshot
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {task?.keyword_tugas || 'Tugas Screenshot'}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Instructions */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">📝 Instruksi:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Kerjakan tugas sesuai deskripsi</li>
            <li>Ambil screenshot sebagai bukti</li>
            <li>Copy link komentar Instagram Anda</li>
            <li>Upload screenshot dan link di bawah ini</li>
            <li>AI akan memverifikasi dalam 4 jam</li>
          </ol>
          {task?.verification_rules?.required_keywords && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Kata kunci yang harus ada:
              </p>
              <div className="flex flex-wrap gap-2">
                {task.verification_rules.required_keywords.map((keyword, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Screenshot <span className="text-red-500">*</span>
            </label>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />

            {!screenshotPreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-purple-50/30 transition-colors disabled:opacity-50"
              >
                <PhotoIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 font-medium">
                  Klik untuk upload screenshot
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG (Max 5MB)
                </p>
              </button>
            ) : (
              <div className="relative">
                <img
                  src={screenshotPreview}
                  alt="Screenshot preview"
                  className="w-full h-64 object-contain bg-gray-100 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => {
                    setScreenshot(null);
                    setScreenshotPreview(null);
                  }}
                  disabled={uploading}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Comment Link */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Link Komentar Instagram <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                value={commentLink}
                onChange={(e) => setCommentLink(e.target.value)}
                placeholder="https://www.instagram.com/p/..."
                disabled={uploading}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 disabled:bg-gray-100"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Paste link komentar Anda dari Instagram
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/20">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={uploading || !screenshot || !commentLink.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className="w-5 h-5" />
                  <span>Upload & Submit</span>
                </>
              )}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
