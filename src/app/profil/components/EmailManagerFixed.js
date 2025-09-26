'use client';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  EnvelopeIcon, 
  PlusIcon, 
  CheckCircleIcon, 
  TrashIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

export default function EmailManager() {
  const { user } = useUser();
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Helper function to render message with appropriate icon
  const renderMessage = (message) => {
    if (!message) return null;
    
    let iconComponent;
    let bgColor, textColor, borderColor;
    
    if (message.includes('berhasil') || message.includes('ditambahkan') || message.includes('diubah') || message.includes('dihapus')) {
      iconComponent = <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      bgColor = 'bg-green-50/80';
      textColor = 'text-green-800';
      borderColor = 'border-green-200/50';
    } else if (message.includes('Gagal') || message.includes('tidak boleh') || message.includes('tidak valid')) {
      iconComponent = <XCircleIcon className="w-5 h-5 text-red-600" />;
      bgColor = 'bg-red-50/80';
      textColor = 'text-red-800';
      borderColor = 'border-red-200/50';
    } else {
      iconComponent = <InformationCircleIcon className="w-5 h-5 text-blue-600" />;
      bgColor = 'bg-blue-50/80';
      textColor = 'text-blue-800';
      borderColor = 'border-blue-200/50';
    }
    
    return (
      <div className={`mb-4 p-4 ${bgColor} backdrop-blur-sm ${borderColor} ${textColor} border rounded-2xl shadow-sm`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {iconComponent}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
        </div>
      </div>
    );
  };

  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !user) return;

    // Enhanced validation
    if (!newEmail.trim()) {
      setMessage('Email address tidak boleh kosong');
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setMessage('Format email tidak valid');
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
      setMessage('Email berhasil ditambahkan! Silakan cek email untuk verifikasi.');
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
        setMessage('Email primary berhasil diubah!');
      }
    } catch (error) {
      console.error('Error setting primary email:', error);
      setMessage(`❌ Gagal mengatur email primary: ${error.errors?.[0]?.message || error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [emailId]: null }));
    }
  };

  const handleRemoveEmail = async (emailId) => {
    if (!user) return;

    // Prevent removing primary email
    const emailToRemove = user.emailAddresses.find(email => email.id === emailId);
    if (emailToRemove && emailToRemove.id === user.primaryEmailAddress?.id) {
      setMessage('❌ Tidak dapat menghapus email primary. Ubah email primary terlebih dahulu.');
      return;
    }

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
        setMessage('Email berhasil dihapus!');
      }
    } catch (error) {
      console.error('Error removing email:', error);
      setMessage(`Gagal menghapus email: ${error.errors?.[0]?.message || error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [emailId]: null }));
    }
  };

  // Get all email addresses
  const emailAddresses = user?.emailAddresses || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <EnvelopeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Kelola Email</h3>
            <p className="text-xs sm:text-sm text-gray-600">
              Tambah, hapus, atau ubah email primary Anda
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors w-full sm:w-auto"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Tambah Email
        </button>
      </div>

      {/* Message Display */}
      {renderMessage(message)}

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

          <form onSubmit={handleAddEmail} className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Tambah Email Baru:</h4>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="contoh@email.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                disabled={loading}
                required
              />
              <div className="flex gap-2 sm:gap-3">
                <button
                  type="submit"
                  disabled={loading || !newEmail.trim()}
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
                    setNewEmail('');
                  }}
                  className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm flex-1 sm:flex-none"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Email List */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Email Addresses</h4>
        
        {emailAddresses.length > 0 ? (
          <div className="space-y-3">
            {emailAddresses.map((email) => (
              <div 
                key={email.id}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg border-2 transition-all ${
                  email.id === user.primaryEmailAddress?.id
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    email.id === user.primaryEmailAddress?.id
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <EnvelopeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {email.emailAddress}
                      </span>
                      {email.id === user.primaryEmailAddress?.id && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full w-fit">
                          <CheckCircleIconSolid className="w-3 h-3" />
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span>
                        Status: {email.verification?.status === 'verified' ? (
                          <span className="text-green-600 font-medium flex items-center gap-1">
                            <CheckCircleIcon className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-yellow-600 font-medium flex items-center gap-1">
                            <ExclamationTriangleIcon className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-2 flex-wrap">
                  {email.id !== user.primaryEmailAddress?.id && (
                    <button
                      onClick={() => handleSetAsPrimary(email.id)}
                      disabled={actionLoading[email.id] === 'primary'}
                      className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1 px-2 py-1 bg-white rounded border border-blue-200 sm:bg-transparent sm:border-transparent sm:px-0 sm:py-0"
                    >
                      {actionLoading[email.id] === 'primary' ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                          <span>Setting...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Set Primary</span>
                        </>
                      )}
                    </button>
                  )}

                  {email.id !== user.primaryEmailAddress?.id && (
                    <button
                      onClick={() => handleRemoveEmail(email.id)}
                      disabled={actionLoading[email.id] === 'remove'}
                      className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1 px-2 py-1 bg-white rounded border border-red-200 sm:bg-transparent sm:border-transparent sm:px-0 sm:py-0"
                    >
                      {actionLoading[email.id] === 'remove' ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                          <span>Removing...</span>
                        </>
                      ) : (
                        <>
                          <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Remove</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <EnvelopeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Email</h3>
            <p className="text-gray-600">
              Tambahkan email pertama Anda untuk mulai menggunakan fitur ini.
            </p>
          </div>
        )}
      </div>

      {/* Email Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="text-blue-500 mt-0.5 flex-shrink-0">
            <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
              <InformationCircleIcon className="w-4 h-4" />
              Tips Email Management:
            </h4>
            <ul className="text-xs sm:text-sm text-blue-700 space-y-0.5 sm:space-y-1">
              <li>• Email primary digunakan untuk notifikasi dan recovery</li>
              <li>• Verifikasi email baru melalui link yang dikirim</li>
              <li>• Minimal harus ada 1 email yang terverifikasi</li>
              <li>• Gunakan email yang mudah diakses untuk primary</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
