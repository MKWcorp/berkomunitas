'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  LinkIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import EditableBCForm from '@/components/EditableBCForm';

export default function PlusPage() {
  const [activeTab, setActiveTab] = useState('connect');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Form data untuk koneksi
  const [formData, setFormData] = useState({
    reseller_id: '',
    input_phone: ''
  });

  // Modal confirmation states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [levelVerificationError, setLevelVerificationError] = useState('');

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/beauty-consultant/connect');
      if (response.ok) {
        const data = await response.json();
        
        // If user is already verified, redirect to verified page
        if (data.success && data.hasConnection && data.data?.verification_status === 'verified') {
          window.location.href = '/plus/verified';
          return;
        }
        
        // Set connection status for rendering
        setConnectionStatus(data);
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
      setConnectionStatus({ success: false, hasConnection: false });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setMessage(null);
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    
    if (!formData.reseller_id || !formData.input_phone) {
      setMessage({
        type: 'error',
        text: 'Semua field wajib diisi'
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    // Retry mechanism for database timeout
    const maxRetries = 3;
    let retryCount = 0;

    const attemptConnect = async () => {
      try {
        const response = await fetch('/api/beauty-consultant/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resellerId: formData.reseller_id.trim(),
            input_phone: formData.input_phone.trim()
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Check if it's a database timeout/busy error
          if (response.status === 503 && retryCount < maxRetries) {
            retryCount++;
            console.log(`🔄 Retrying connection attempt ${retryCount}/${maxRetries}`);
            setMessage({
              type: 'error',
              text: `Database busy, retrying... (${retryCount}/${maxRetries})`
            });
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
            return attemptConnect();
          }
          throw new Error(data.error || 'Terjadi kesalahan saat menghubungkan');
        }

        return data;
      } catch (error) {
        if (retryCount < maxRetries && (error.message.includes('fetch') || error.message.includes('network'))) {
          retryCount++;
          console.log(`🔄 Network retry ${retryCount}/${maxRetries}`);
          setMessage({
            type: 'error',
            text: `Connection issue, retrying... (${retryCount}/${maxRetries})`
          });
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          return attemptConnect();
        }
        throw error;
      }
    };

    try {
      const data = await attemptConnect();

      // Jika response meminta konfirmasi, tampilkan modal
      if (data.requires_confirmation && data.preview_data) {
        setPreviewData({
          resellerId: formData.reseller_id.trim(),
          nama_preview: data.preview_data.nama_preview,
          area: data.preview_data.area,
          raw_data: data.raw_data
        });
        setShowConfirmModal(true);
      } else if (data.success) {
        // Show success message and redirect if verified
        setMessage({
          type: 'success',
          text: data.message,
          details: data.details
        });
        
        // If auto-verified, redirect to verified page
        if (data.data?.auto_verified || data.message.includes('verified')) {
          setTimeout(() => {
            window.location.href = '/plus/verified';
          }, 2000);
        } else {
          // Refresh connection status to show pending state
          setTimeout(() => {
            checkConnectionStatus();
          }, 2000);
        }
        
        // Reset form
        setFormData({
          reseller_id: '',
          input_phone: ''
        });
        
        // Reset form
        setFormData({
          reseller_id: '',
          input_phone: ''
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmConnection = async () => {
    if (!selectedLevel) {
      setLevelVerificationError('Pilih level/status Anda terlebih dahulu');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/beauty-consultant/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reseller_id: previewData.resellerId,
          input_phone: formData.input_phone.trim(),
          selected_level: selectedLevel,
          raw_data: previewData.raw_data
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat mengonfirmasi koneksi');
      }

      setShowConfirmModal(false);
      setMessage({
        type: 'success',
        text: data.message,
        details: data.details
      });

      // Always redirect to verified after manual confirmation
      setTimeout(() => {
        window.location.href = '/plus/verified';
      }, 2000);

      // Reset states
      setFormData({
        reseller_id: '',
        input_phone: ''
      });
      setPreviewData(null);
      setSelectedLevel('');

      // Reset states
      setFormData({
        reseller_id: '',
        input_phone: ''
      });
      setPreviewData(null);
      setSelectedLevel('');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message
      });
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelConnection = () => {
    setShowConfirmModal(false);
    setPreviewData(null);
    setSelectedLevel('');
    setLevelVerificationError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Already connected view with glass design
  if (connectionStatus?.success && connectionStatus?.hasConnection) {
    const connection = connectionStatus.data;
    const statusConfig = {
      verified: {
        icon: CheckCircleIcon,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-200/30',
        title: 'Terverifikasi & Aktif!',
        description: 'Akun Beauty Consultant Anda terhubung dan terverifikasi.'
      },
      pending: {
        icon: ClockIcon,
        color: 'text-amber-600',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-200/30',
        title: 'Verifikasi Tertunda',
        description: 'Permintaan koneksi Anda menunggu verifikasi manual oleh tim kami.'
      },
      rejected: {
        icon: ExclamationTriangleIcon,
        color: 'text-rose-600',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-200/30',
        title: 'Koneksi Ditolak',
        description: 'Permintaan koneksi Anda ditolak. Silakan hubungi dukungan untuk bantuan.'
      }
    };

    const config = statusConfig[connection.verification_status] || statusConfig.pending;
    const StatusIcon = config.icon;

    return (
      <div className="min-h-screen bg-white py-6 sm:py-12 px-4">
        <div className="max-w-lg sm:max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center mb-4">
              <span className="text-xl sm:text-2xl mr-2">👑</span>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                BerkomunitasPlus
              </h1>
            </div>
            <p className="text-gray-600 text-sm sm:text-base">Program Beauty Consultant DRW Skincare</p>
          </div>

          {/* Connection Status */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 mb-6 shadow-lg">
            <div className="flex items-center justify-center mb-6">
              <StatusIcon className={`h-12 sm:h-16 w-12 sm:w-16 ${config.color} drop-shadow-lg`} />
            </div>
            
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{config.title}</h2>
              <p className="text-gray-600 text-sm sm:text-base">{config.description}</p>
            </div>

            {/* Connection Details - Use Editable Form */}
            <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100">
              <EditableBCForm 
                connectionStatus={connectionStatus}
                onDataUpdate={checkConnectionStatus}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-lg">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <span className="text-xl sm:text-2xl mr-2">🚀</span>
                <span className="text-lg sm:text-xl font-semibold text-gray-900">
                  Jelajahi Platform
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto">
                <button
                  onClick={() => router.push('/profil')}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 text-white px-4 sm:px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-md"
                >
                  👤 Lihat Profil
                </button>
                <button
                  onClick={() => router.push('/rewards')}
                  className="flex-1 bg-green-600 hover:bg-green-700 border border-green-600 text-white px-4 sm:px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-md"
                >
                  🎁 Rewards
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration/Connection form view with glass design
  return (
    <div className="min-h-screen bg-white py-6 sm:py-12 px-4">
      <div className="max-w-lg sm:max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4">
            <span className="text-xl sm:text-2xl mr-2">👑</span>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              Bergabung BerkomunitasPlus
            </h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-lg text-center leading-relaxed">
            Hubungkan akun Beauty Consultant DRW Skincare Anda untuk membuka manfaat eksklusif
          </p>
        </div>

        {/* Benefits Overview */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 mb-6 shadow-lg">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 text-center">Manfaat BerkomunitasPlus</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full w-12 sm:w-16 h-12 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-md">
                <span className="text-lg sm:text-2xl text-white">✨</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Rewards Eksklusif</h3>
              <p className="text-xs sm:text-sm text-gray-600">Akses rewards premium dan penawaran khusus</p>
            </div>
            
            <div className="text-center bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full w-12 sm:w-16 h-12 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-md">
                <span className="text-lg sm:text-2xl text-white">👑</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Dukungan Prioritas</h3>
              <p className="text-xs sm:text-sm text-gray-600">Dapatkan bantuan dan dukungan prioritas</p>
            </div>
            
            <div className="text-center bg-gray-50 rounded-2xl p-4 border border-gray-100 sm:col-span-1 col-span-1 mx-auto max-w-xs sm:max-w-none">
              <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-full w-12 sm:w-16 h-12 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-md">
                <span className="text-lg sm:text-2xl text-white">🛡️</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Status Terverifikasi</h3>
              <p className="text-xs sm:text-sm text-gray-600">Badge Beauty Consultant terverifikasi</p>
            </div>
          </div>
        </div>

        {/* Connection Form */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-lg">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('connect')}
                className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 text-center font-medium transition-all duration-300 text-sm sm:text-base ${
                  activeTab === 'connect'
                    ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <LinkIcon className="h-4 sm:h-5 w-4 sm:w-5 inline mr-2" />
                Hubungkan Akun
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 text-center font-medium transition-all duration-300 text-sm sm:text-base ${
                  activeTab === 'register'
                    ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <UserPlusIcon className="h-4 sm:h-5 w-4 sm:w-5 inline mr-2" />
                Pendaftaran Baru
              </button>
            </nav>
          </div>

          <div className="p-6 sm:p-8">
            {activeTab === 'connect' ? (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Hubungkan Akun Beauty Consultant Anda</h2>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">
                  Sudah menjadi Beauty Consultant DRW Skincare? Hubungkan akun yang ada untuk mengaktifkan manfaat BerkomunitasPlus.
                </p>

                <form onSubmit={handleConnect} className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Beauty Consultant *
                    </label>
                    <input
                      type="text"
                      name="reseller_id"
                      value={formData.reseller_id}
                      onChange={handleInputChange}
                      placeholder="Contoh: 282-302-1009-1003-2001"
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Masukkan ID Beauty Consultant Anda (dengan atau tanpa tanda hubung)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor Telepon (WhatsApp) *
                    </label>
                    <input
                      type="tel"
                      name="input_phone"
                      value={formData.input_phone}
                      onChange={handleInputChange}
                      placeholder="08xxxxxxxxx"
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Masukkan nomor telepon yang terdaftar di akun Beauty Consultant Anda
                    </p>
                  </div>

                  {message && (
                    <div className={`p-4 rounded-xl border ${
                      message.type === 'success' 
                        ? 'bg-green-50 text-green-800 border-green-200' 
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}>
                      <p className="font-medium">{message.text}</p>
                      {message.details && message.type === 'success' && (
                        <div className="mt-2 text-sm">
                          <p>✓ Terhubung ke: {message.details.bc_name}</p>
                          <p>✓ Status: {message.details.verification_status}</p>
                          {message.details.auto_verified && (
                            <p className="font-semibold text-green-700 mt-2">
                              🎉 Verifikasi otomatis berhasil! BerkomunitasPlus diaktifkan!
                            </p>
                          )}
                          {message.details.privilege_updated && (
                            <p className="font-semibold text-blue-700 mt-1">
                              ✨ Hak istimewa BerkomunitasPlus diberikan!
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !formData.reseller_id || !formData.input_phone}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg border border-indigo-600"
                  >
                    {submitting ? 'Menghubungkan...' : 'Hubungkan Akun'}
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Daftar sebagai Beauty Consultant Baru</h2>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">
                  Bergabunglah dengan ribuan Beauty Consultant DRW Skincare dan raih kesempatan menjadi milyarder!
                </p>

                <div className="backdrop-blur-sm bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-400/20 rounded-2xl p-6 sm:p-8">
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center mb-4">
                      <span className="text-2xl sm:text-4xl mr-2">💰</span>
                      <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                        Peluang Emas Menanti!
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                    <div className="text-center">
                      <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl p-4 shadow-sm">
                        <span className="text-xl sm:text-2xl mb-2 block">🏪</span>
                        <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">Temukan Beauty Consultant</h4>
                        <p className="text-xs sm:text-sm text-gray-600">Cari Beauty Consultant DRW Skincare terdekat di kotamu</p>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl p-4 shadow-sm">
                        <span className="text-xl sm:text-2xl mb-2 block">📝</span>
                        <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">Daftar Jadi Reseller</h4>
                        <p className="text-xs sm:text-sm text-gray-600">Mulai perjalanan bisnis Anda sebagai reseller produk DRW</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl p-4 sm:p-6 shadow-sm mb-6">
                    <div className="flex items-center justify-center mb-3">
                      <span className="text-2xl sm:text-3xl mr-2">💎</span>
                      <h4 className="text-lg sm:text-xl font-bold text-gray-800">Kesempatan Menjadi Milyarder</h4>
                    </div>
                    <p className="text-gray-700 mb-4 text-sm sm:text-base">
                      Bergabung dengan <strong className="text-orange-600">DRW Skincare</strong> dan bangun empire bisnis kecantikan Anda! 
                      Ratusan member kami telah merasakan kesuksesan financial freedom.
                    </p>
                    <div className="flex items-center justify-center text-xs sm:text-sm text-gray-600">
                      <span className="mr-2">✨</span>
                      <span>Sistem support terpercaya • Training lengkap • Bonus unlimited</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <a 
                      href="https://www.instagram.com/beautypreneurdrw/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg border border-yellow-600 text-sm sm:text-base"
                    >
                      📱 Info Selengkapnya
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 mt-6 shadow-lg">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 text-center">Pertanyaan yang Sering Diajukan</h2>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Apa itu BerkomunitasPlus?</h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                BerkomunitasPlus adalah program keanggotaan premium kami untuk Beauty Consultant DRW Skincare yang terverifikasi, 
                menawarkan rewards eksklusif, dukungan prioritas, dan hak istimewa khusus.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Bagaimana cara kerja verifikasi?</h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Jika nomor telepon Anda cocok dengan database Beauty Consultant kami, Anda akan diverifikasi secara otomatis. 
                Jika tidak, tim kami akan memverifikasi akun Anda secara manual dalam 1-2 hari kerja.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Di mana saya bisa menemukan ID Beauty Consultant saya?</h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                ID Beauty Consultant Anda diberikan saat pertama kali mendaftar sebagai konsultan. 
                Periksa email konfirmasi pendaftaran Anda atau hubungi dukungan untuk bantuan.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi */}
      {showConfirmModal && previewData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 max-w-md mx-auto shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Konfirmasi Koneksi Beauty Consultant
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="text-center bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-2">Anda akan terhubung dengan akun:</p>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">ID Reseller: </span>
                    <span className="font-mono text-sm text-gray-900">****{previewData.resellerId.slice(-5)}</span>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700">Nama: </span>
                    <span className="font-medium text-gray-900">{previewData.nama_preview}</span>
                  </div>
                  
                  {previewData.area && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Area: </span>
                      <span className="text-sm text-gray-900">{previewData.area}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-900 mb-3">
                  🔐 Verifikasi Keamanan - Pilih Level/Status Anda Saat Ini:
                </p>
                
                <div className="space-y-2">
                  {['Consultant', 'Supervisor', 'Manager', 'Director'].map((level) => (
                    <label key={level} className="flex items-center">
                      <input
                        type="radio"
                        name="levelVerification"
                        value={level}
                        checked={selectedLevel === level}
                        onChange={(e) => {
                          setSelectedLevel(e.target.value);
                          setLevelVerificationError('');
                        }}
                        className="mr-3 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{level}</span>
                    </label>
                  ))}
                </div>
                
                {levelVerificationError && (
                  <p className="text-sm text-red-600 mt-2 font-medium">
                    ⚠️ {levelVerificationError}
                  </p>
                )}
                
                <p className="text-xs text-blue-600 mt-2">
                  ⚠️ <strong>Penting:</strong> Pilih level yang sesuai dengan status Anda di sistem Beauty Consultant. 
                  Jika salah, akun akan ditolak dan Anda perlu input ulang dengan data yang benar.
                </p>
              </div>
              
              <p className="text-sm text-gray-600 text-center">
                Apakah semua data di atas sudah benar?
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelConnection}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-xl font-medium transition-all"
                disabled={submitting}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmConnection}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 ${
                  selectedLevel 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg transform hover:scale-105' 
                    : 'bg-gray-400 text-white cursor-not-allowed'
                }`}
                disabled={submitting || !selectedLevel}
              >
                {submitting ? 'Memverifikasi...' : selectedLevel ? 'Ya, Hubungkan' : 'Pilih Level Dulu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}