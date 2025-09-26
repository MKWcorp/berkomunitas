'use client';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  PhoneIcon, 
  PlusIcon, 
  CheckCircleIcon, 
  TrashIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

export default function PhoneNumberManager() {
  const { user } = useUser();
  const [newPhone, setNewPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddPhone = async (e) => {
    e.preventDefault();
    if (!newPhone.trim() || !user) return;

    setLoading(true);
    setMessage('');

    try {
      // Using Clerk's user.createPhoneNumber() method
      await user.createPhoneNumber({ phoneNumber: newPhone.trim() });
      
      setMessage('Nomor telepon berhasil ditambahkan! Silakan verifikasi nomor Anda.');
      setNewPhone('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding phone:', error);
      setMessage(`Gagal menambahkan nomor telepon: ${error.errors?.[0]?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetAsPrimary = async (phoneId) => {
    if (!user) return;

    setActionLoading(prev => ({ ...prev, [phoneId]: 'primary' }));
    setMessage('');

    try {
      // Find the phone number object
      const phoneNumber = user.phoneNumbers.find(phone => phone.id === phoneId);
      if (phoneNumber) {
        // Using Clerk's phoneNumber.setAsPrimary() method
        await phoneNumber.setAsPrimary();
        setMessage('Nomor telepon berhasil dijadikan primary!');
      }
    } catch (error) {
      console.error('Error setting primary phone:', error);
      setMessage(`Gagal mengatur primary phone: ${error.errors?.[0]?.message || error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [phoneId]: null }));
    }
  };

  const handleRemovePhone = async (phoneId) => {
    if (!user) return;

    // Confirm before deleting
    if (!confirm('Apakah Anda yakin ingin menghapus nomor telepon ini?')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [phoneId]: 'remove' }));
    setMessage('');

    try {
      // Find the phone number object
      const phoneNumber = user.phoneNumbers.find(phone => phone.id === phoneId);
      if (phoneNumber) {
        // Using Clerk's phoneNumber.destroy() method
        await phoneNumber.destroy();
        setMessage('Nomor telepon berhasil dihapus!');
      }
    } catch (error) {
      console.error('Error removing phone:', error);
      setMessage(`Gagal menghapus nomor telepon: ${error.errors?.[0]?.message || error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [phoneId]: null }));
    }
  };

  const handleResendVerification = async (phoneId) => {
    if (!user) return;

    setActionLoading(prev => ({ ...prev, [phoneId]: 'verify' }));
    setMessage('');

    try {
      // Find the phone number object
      const phoneNumber = user.phoneNumbers.find(phone => phone.id === phoneId);
      if (phoneNumber && phoneNumber.prepareVerification) {
        await phoneNumber.prepareVerification({ strategy: 'phone_code' });
        setMessage('Kode verifikasi telah dikirim ke nomor telepon Anda!');
      }
    } catch (error) {
      console.error('Error sending verification:', error);
      setMessage(`Gagal mengirim kode verifikasi: ${error.errors?.[0]?.message || error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [phoneId]: null }));
    }
  };

  const formatPhoneNumber = (phoneNumber) => {
    // Simple formatting for Indonesian numbers
    if (phoneNumber.startsWith('+62')) {
      return phoneNumber.replace('+62', '0');
    }
    return phoneNumber;
  };

  if (!user) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6">
        <div className="flex items-center gap-3">
          <PhoneIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Kelola Nomor Telepon</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors w-full sm:w-auto"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Tambah Nomor
        </button>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.includes('✅') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Add Phone Form */}
      {showAddForm && (
        <form onSubmit={handleAddPhone} className="mb-6 p-3 sm:p-4 bg-blue-50/80 backdrop-blur-sm rounded-2xl border border-blue-200/50 shadow-sm">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Tambah Nomor Telepon Baru:</h4>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+628123456789 atau 08123456789"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              disabled={loading}
              required
            />
            <div className="flex gap-2 sm:gap-3">
              <button
                type="submit"
                disabled={loading || !newPhone.trim()}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex-1 sm:flex-none"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Tambah
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewPhone('');
                }}
                className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm flex-1 sm:flex-none"
              >
                Batal
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            💡 Format: +628123456789 (internasional) atau 08123456789 (lokal)
          </p>
        </form>
      )}

      {/* Phone Numbers List */}
      <div className="space-y-3">
        {user.phoneNumbers && user.phoneNumbers.length > 0 ? (
          user.phoneNumbers.map((phone) => {
            const isPrimary = phone.id === user.primaryPhoneNumberId;
            const isVerified = phone.verification?.status === 'verified';
            const currentLoading = actionLoading[phone.id];

            return (
              <div 
                key={phone.id} 
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-2xl border ${
                  isPrimary ? 'bg-blue-50/80 backdrop-blur-sm border-blue-200/50' : 'bg-gray-50/80 backdrop-blur-sm border-gray-200/50'
                } shadow-sm`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <PhoneIcon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isPrimary ? 'text-blue-600' : 'text-gray-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className={`font-medium text-sm sm:text-base truncate ${isPrimary ? 'text-blue-900' : 'text-gray-800'}`}>
                        {formatPhoneNumber(phone.phoneNumber)}
                      </span>
                      {isPrimary && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full w-fit">
                          <CheckCircleIconSolid className="w-3 h-3 mr-1" />
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {isVerified ? (
                        <span className="inline-flex items-center text-xs text-green-600">
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-yellow-600">
                          <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                          Unverified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {!isVerified && (
                    <button
                      onClick={() => handleResendVerification(phone.id)}
                      disabled={currentLoading === 'verify'}
                      className="text-xs px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded transition-colors disabled:opacity-50 flex-1 sm:flex-none"
                    >
                      {currentLoading === 'verify' ? 'Sending...' : 'Resend Code'}
                    </button>
                  )}
                  
                  {!isPrimary && isVerified && (
                    <button
                      onClick={() => handleSetAsPrimary(phone.id)}
                      disabled={currentLoading === 'primary'}
                      className="text-xs px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors disabled:opacity-50 flex-1 sm:flex-none"
                    >
                      {currentLoading === 'primary' ? 'Setting...' : 'Set as Primary'}
                    </button>
                  )}
                  
                  {!isPrimary && (
                    <button
                      onClick={() => handleRemovePhone(phone.id)}
                      disabled={currentLoading === 'remove'}
                      className="text-red-600 hover:text-red-700 p-1 rounded transition-colors disabled:opacity-50 flex items-center justify-center w-8 h-8 bg-white border border-red-200 sm:bg-transparent sm:border-transparent"
                      title="Hapus nomor telepon"
                    >
                      {currentLoading === 'remove' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <TrashIcon className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <PhoneIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>Belum ada nomor telepon yang terdaftar</p>
            <p className="text-sm">Tambahkan nomor telepon untuk keamanan tambahan</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          💡 <strong>Tips:</strong> Nomor telepon primary akan digunakan untuk verifikasi 2FA dan pemulihan akun. 
          Pastikan nomor sudah diverifikasi dan masih aktif.
        </p>
      </div>
    </div>
  );
}
