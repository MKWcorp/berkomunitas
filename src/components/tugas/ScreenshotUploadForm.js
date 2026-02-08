/**
 * ScreenshotUploadForm Component
 * Inline form untuk upload screenshot (expandable dalam task card)
 */
'use client';
import { useState, useRef } from 'react';
import { PhotoIcon, ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ScreenshotUploadForm({ 
  task, 
  onSubmit,
  onCancel 
}) {
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
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

  const handleRemoveImage = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!screenshot) {
      setError('Screenshot wajib diupload');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('screenshot', screenshot);
      formData.append('task_id', task.id);

      await onSubmit(formData);
      
      // Reset form
      handleRemoveImage();
    } catch (err) {
      setError(err.message || 'Gagal mengupload screenshot');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      {/* Instruction Text */}
      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-700 font-medium">
          Kirim komentar sesuai keyword, screenshot, lalu upload screenshot untuk dicek oleh AI
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Screenshot Upload */}
        <div>
          <label className="block text-xs font-semibold text-gray-800 mb-1">
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
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <PhotoIcon className="w-8 h-8 mx-auto text-gray-400 mb-1" />
              <p className="text-xs text-gray-600 font-medium">
                Klik untuk upload screenshot
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                JPG, PNG (Max 5MB)
              </p>
            </button>
          ) : (
            <div className="relative">
              <img
                src={screenshotPreview}
                alt="Screenshot preview"
                className="w-full h-48 object-contain bg-white rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => {
                  setScreenshot(null);
                  setScreenshotPreview(null);
                }}
                disabled={uploading}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-full font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={uploading || !screenshot}
            className="flex-1 px-4 py-2 text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-full font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="w-4 h-4" />
                <span>Upload & Submit</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
