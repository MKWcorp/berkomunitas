'use client';
import { useState } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { 
  EnvelopeIcon, 
  PlusIcon, 
  CheckCircleIcon, 
  TrashIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

export default function EmailManager() {
  const { user } = useSSOUser();
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !user) return;

    // Enhanced validation
    if (!newEmail.trim()) {
      setMessage('❌ Email address tidak boleh kosong');
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setMessage('❌ Format email tidak valid');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Enhanced parameter passing for development environment
      const emailAddress = newEmail.trim();
      console.log('Adding email:', emailAddress); // Debug log
      
      // Using Clerk's user.createEmailAddress() method with explicit parameter
      const result = await user.createEmailAddress({ 
        emailAddress: emailAddress 
      });
      
      console.log('Email added successfully:', result); // Debug log
      setMessage('✅ Email berhasil ditambahkan! Silakan cek email untuk verifikasi.');
      setNewEmail('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding email:', error);
      
      // Enhanced error handling for development environment
      if (error.message?.includes('email_address must be included') || 
          error.errors?.[0]?.message?.includes('email_address must be included')) {
        setMessage(`🔒 Error di development environment. Silakan coba melalui menu "Pengaturan" di dropdown profil untuk menambahkan email.`);
      } else if (error.errors?.[0]?.code === 'form_param_missing') {
        setMessage(`❌ Parameter email tidak valid. Coba refresh halaman dan ulangi.`);
      } else if (error.errors?.[0]?.code === 'form_identifier_exists') {
        setMessage(`❌ Email ini sudah terdaftar di akun Anda atau akun lain.`);
      } else {
        setMessage(`❌ Gagal menambahkan email: ${error.errors?.[0]?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetAsPrimary = async (emailId) => {
    if (!user) return;

    setActionLoading(prev => ({ ...prev, [emailId]: 'primary' }));
    setMessage('');

    try {
      // Find the email address object
      const emailAddress = user.emailAddresses.find(email => email.id === emailId);
      if (emailAddress) {
        // Using Clerk's emailAddress.setAsPrimary() method
        await emailAddress.setAsPrimary();
        setMessage('✅ Email berhasil dijadikan primary!');
      }
    } catch (error) {
      console.error('Error setting primary email:', error);
      setMessage(`❌ Gagal mengatur primary email: ${error.errors?.[0]?.message || error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [emailId]: null }));
    }
  };

  const handleRemoveEmail = async (emailId) => {
    if (!user) return;

    // Confirm before deleting
    if (!confirm('Apakah Anda yakin ingin menghapus email ini?')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [emailId]: 'remove' }));
    setMessage('');

    try {
      // Find the email address object
      const emailAddress = user.emailAddresses.find(email => email.id === emailId);
      if (emailAddress) {
        // Using Clerk's emailAddress.destroy() method
        await emailAddress.destroy();
        setMessage('✅ Email berhasil dihapus!');
      }
    } catch (error) {
      console.error('Error removing email:', error);
      setMessage(`❌ Gagal menghapus email: ${error.errors?.[0]?.message || error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [emailId]: null }));
    }
  };

  const handleResendVerification = async (emailId) => {
    if (!user) return;

    setActionLoading(prev => ({ ...prev, [emailId]: 'verify' }));
    setMessage('');

    try {
      // Find the email address object
      const emailAddress = user.emailAddresses.find(email => email.id === emailId);
      if (emailAddress && emailAddress.prepareVerification) {
        await emailAddress.prepareVerification({ strategy: 'email_code' });
        setMessage('✅ Email verifikasi telah dikirim ulang!');
      }
    } catch (error) {
      console.error('Error sending verification:', error);
      setMessage(`❌ Gagal mengirim email verifikasi: ${error.errors?.[0]?.message || error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [emailId]: null }));
    }
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
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <EnvelopeIcon className="w-6 h-6 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Kelola Alamat Email</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Tambah Email
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

      {/* Add Email Form */}
      {showAddForm && (
        <div className="mb-6">
          {/* Development Environment Notice */}
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-yellow-500 mt-0.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h5 className="text-sm font-medium text-yellow-800 mb-1">Development Environment</h5>
                <p className="text-xs text-yellow-700">
                  Jika menambah email gagal, gunakan <strong>menu "Pengaturan"</strong> di dropdown profil untuk menambah email melalui UI Clerk.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddEmail} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Tambah Email Baru:</h4>
            <div className="flex gap-3">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="contoh@email.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                required
              />
              <button
                type="submit"
                disabled={loading || !newEmail.trim()}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  setNewEmail('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Email Addresses List */}
      <div className="space-y-3">
        {user.emailAddresses && user.emailAddresses.length > 0 ? (
          user.emailAddresses.map((email) => {
            const isPrimary = email.id === user.primaryEmailAddressId;
            const isVerified = email.verification?.status === 'verified';
            const currentLoading = actionLoading[email.id];

            return (
              <div 
                key={email.id} 
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  isPrimary ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className={`w-5 h-5 ${isPrimary ? 'text-blue-600' : 'text-gray-500'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isPrimary ? 'text-blue-900' : 'text-gray-800'}`}>
                        {email.emailAddress}
                      </span>
                      {isPrimary && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
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

                <div className="flex items-center gap-2">
                  {!isVerified && (
                    <button
                      onClick={() => handleResendVerification(email.id)}
                      disabled={currentLoading === 'verify'}
                      className="text-xs px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded transition-colors disabled:opacity-50"
                    >
                      {currentLoading === 'verify' ? 'Sending...' : 'Resend Verification'}
                    </button>
                  )}
                  
                  {!isPrimary && isVerified && (
                    <button
                      onClick={() => handleSetAsPrimary(email.id)}
                      disabled={currentLoading === 'primary'}
                      className="text-xs px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors disabled:opacity-50"
                    >
                      {currentLoading === 'primary' ? 'Setting...' : 'Set as Primary'}
                    </button>
                  )}
                  
                  {!isPrimary && (
                    <button
                      onClick={() => handleRemoveEmail(email.id)}
                      disabled={currentLoading === 'remove'}
                      className="text-red-600 hover:text-red-700 p-1 rounded transition-colors disabled:opacity-50"
                      title="Hapus email"
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
          <div className="text-center py-4 text-gray-500">
            Belum ada email address yang terdaftar
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          💡 <strong>Tips:</strong> Email primary akan digunakan untuk notifikasi dan komunikasi utama. 
          Pastikan email sudah diverifikasi sebelum menjadikannya primary.
        </p>
      </div>
    </div>
  );
}
