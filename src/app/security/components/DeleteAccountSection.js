'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  TrashIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';

export default function DeleteAccountSection() {
  const { user } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const expectedConfirmText = 'HAPUS AKUN SAYA';

  const handleDeleteAccount = async () => {
    if (confirmText !== expectedConfirmText) {
      setMessage({ 
        type: 'error', 
        text: 'Teks konfirmasi tidak sesuai. Ketik "HAPUS AKUN SAYA" dengan benar.' 
      });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Call user.delete() to permanently delete the user's account
      await user.delete();
      
      // This code won't run because user will be redirected after deletion
      setMessage({ 
        type: 'success', 
        text: 'Akun Anda telah berhasil dihapus.' 
      });
      
    } catch (error) {
      console.error('Account deletion error:', error);
      
      // Handle specific Clerk errors
      if (error.errors && error.errors.length > 0) {
        const errorMsg = error.errors[0].message;
        setMessage({ type: 'error', text: errorMsg });
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Terjadi kesalahan saat menghapus akun. Silakan coba lagi.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setShowModal(true);
    setConfirmText('');
    setMessage({ type: '', text: '' });
  };

  const closeModal = () => {
    setShowModal(false);
    setConfirmText('');
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="space-y-6">
      {/* Danger Zone Header */}
      <div className="border-t border-red-200 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-900">Zona Berbahaya</h3>
            <p className="text-sm text-red-700">
              Tindakan di bawah ini tidak dapat dibatalkan
            </p>
          </div>
        </div>
      </div>

      {/* Delete Account Section */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-red-900 mb-2">
              Hapus Akun Permanen
            </h4>
            <div className="space-y-3 text-sm text-red-800">
              <p>
                Menghapus akun Anda akan <strong>secara permanen</strong> menghapus semua data yang terkait dengan akun ini.
              </p>
              
              <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                <h5 className="font-medium text-red-900 mb-2">⚠️ Yang akan dihapus:</h5>
                <ul className="space-y-1 text-red-800">
                  <li>• Profil dan informasi pribadi</li>
                  <li>• Semua komentar dan postingan</li>
                  <li>• Riwayat aktivitas dan statistik</li>
                  <li>• Pengaturan dan preferensi</li>
                  <li>• Akun terhubung (Google, Facebook, dll)</li>
                </ul>
              </div>

              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                <h5 className="font-medium text-yellow-900 mb-2">🔄 Catatan Penting:</h5>
                <ul className="space-y-1 text-yellow-800">
                  <li>• Tindakan ini <strong>TIDAK DAPAT DIBATALKAN</strong></li>
                  <li>• Anda tidak dapat memulihkan akun setelah dihapus</li>
                  <li>• Email yang sama tidak dapat digunakan untuk registrasi ulang selama 30 hari</li>
                  <li>• Backup data Anda sebelum melanjutkan jika diperlukan</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Button */}
        <div className="mt-6 pt-4 border-t border-red-300">
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
          >
            <TrashIcon className="w-4 h-4" />
            Hapus Akun Permanen
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Konfirmasi Hapus Akun
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Final Warning */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ShieldExclamationIcon className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900 mb-2">Peringatan Terakhir!</h4>
                    <p className="text-sm text-red-800">
                      Anda akan <strong>menghapus permanen</strong> akun untuk:
                    </p>
                    <div className="mt-2 p-2 bg-red-100 rounded border">
                      <p className="font-mono text-sm text-red-900">
                        {user?.emailAddresses?.[0]?.emailAddress || user?.primaryEmailAddress?.emailAddress || 'Email tidak tersedia'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Untuk melanjutkan, ketik <span className="font-mono bg-gray-100 px-1 rounded">HAPUS AKUN SAYA</span> di bawah ini:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => {
                    setConfirmText(e.target.value);
                    if (message.text) setMessage({ type: '', text: '' });
                  }}
                  placeholder="Ketik: HAPUS AKUN SAYA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                />
              </div>

              {/* Message */}
              {message.text && (
                <div className={`p-3 rounded-lg text-sm ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Understanding Checklist */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Saya memahami bahwa:</h5>
                <div className="space-y-2 text-sm text-gray-700">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded text-red-600" readOnly checked />
                    <span>Semua data saya akan dihapus permanen</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded text-red-600" readOnly checked />
                    <span>Akun tidak dapat dipulihkan setelah dihapus</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded text-red-600" readOnly checked />
                    <span>Tindakan ini tidak dapat dibatalkan</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading || confirmText !== expectedConfirmText}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <TrashIcon className="w-4 h-4" />
                    <span>Ya, Hapus Akun Saya</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
