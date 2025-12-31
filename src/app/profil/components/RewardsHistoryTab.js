'use client';
import { useState, useEffect } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { 
  CalendarIcon, 
  GiftIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const STATUS_COLORS = {
  'menunggu_verifikasi': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'diproses': 'bg-blue-100 text-blue-800 border-blue-200',
  'dikirim': 'bg-green-100 text-green-800 border-green-200',
  'diterima': 'bg-green-100 text-green-800 border-green-200', // Status konfirmasi user
  'selesai': 'bg-green-100 text-green-800 border-green-200',
  'dibatalkan': 'bg-red-100 text-red-800 border-red-200',
  'ditolak': 'bg-red-100 text-red-800 border-red-200'
};

const STATUS_ICONS = {
  'menunggu_verifikasi': ClockIcon,
  'diproses': ClockIcon,
  'dikirim': CheckCircleIcon,
  'diterima': CheckCircleIcon, // Status konfirmasi user
  'selesai': CheckCircleIcon,
  'dibatalkan': XCircleIcon,
  'ditolak': XCircleIcon
};

const STATUS_LABELS = {
  'menunggu_verifikasi': 'Menunggu Verifikasi',
  'diproses': 'Sedang Diproses',
  'dikirim': 'Dikirim',
  'diterima': 'Diterima', // Status konfirmasi user - warna hijau
  'selesai': 'Selesai',
  'dibatalkan': 'Dibatalkan',
  'ditolak': 'Ditolak'
};

export default function RewardsHistoryTab() {
  const { user, isLoaded } = useSSOUser();
  const [rewardsHistory, setRewardsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states for confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch rewards history
  const fetchRewardsHistory = async () => {
    if (!isLoaded || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/profil/rewards-history', {
        method: 'GET',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setRewardsHistory(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch rewards history');
      }
    } catch (err) {
      console.error('Error fetching rewards history:', err);
      setError('Failed to fetch rewards history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewardsHistory();
  }, [isLoaded, user]);

  // Handle konfirmasi barang diterima
  const handleConfirmReceived = (redemption) => {
    setSelectedRedemption(redemption);
    setReviewText(redemption.redemption_notes || '');
    setShowConfirmModal(true);
  };

  // Submit konfirmasi
  const submitConfirmation = async () => {
    if (!selectedRedemption) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/profil/rewards-history/${selectedRedemption.id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          redemption_notes: reviewText
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Log the successful confirmation
        console.log('Confirmation successful:', result);
        
        // Refresh data to get updated status
        await fetchRewardsHistory();
        
        // Close modal and reset form
        setShowConfirmModal(false);
        setSelectedRedemption(null);
        setReviewText('');
        
        // Show success message
        alert('Konfirmasi berhasil! Status telah diubah menjadi "Diterima". Terima kasih atas ulasan Anda.');
      } else {
        alert(result.error || 'Gagal melakukan konfirmasi');
      }
    } catch (err) {
      console.error('Error confirming receipt:', err);
      alert('Terjadi kesalahan saat melakukan konfirmasi');
    } finally {
      setSubmitting(false);
    }
  };

  // Format number with thousands separator
  const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading History</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchRewardsHistory}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg">
            <GiftIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Riwayat Penukaran Rewards</h2>
            <p className="text-sm text-gray-600">History penukaran hadiah Anda</p>
          </div>
        </div>
        
        <button
          onClick={fetchRewardsHistory}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors text-sm"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {rewardsHistory.length === 0 ? (
        <div className="text-center py-12">
          <GiftIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Belum Ada Penukaran Rewards</h3>
          <p className="text-gray-500 mb-4">
            Anda belum pernah menukar rewards. Kunjungi halaman rewards untuk mulai menukar hadiah.
          </p>
          <a
            href="/rewards"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            <GiftIcon className="h-4 w-4 mr-2" />
            Lihat Rewards
          </a>
        </div>      ) : (
        <div className="space-y-4">
          {rewardsHistory.map((redemption, index) => {
            const StatusIcon = STATUS_ICONS[redemption.status] || ClockIcon;
            
            return (
              <div
                key={redemption.id ? `redemption-${redemption.id}` : `redemption-${index}`}
                className="bg-white/50 border border-white/40 rounded-xl p-4 hover:shadow-md transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Reward Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      {redemption.reward?.foto_url ? (
                        <img
                          src={redemption.reward.foto_url}
                          alt={redemption.reward.reward_name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-200/50 to-purple-200/50 rounded-lg flex items-center justify-center">
                          <GiftIcon className="h-8 w-8 text-blue-500" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 text-lg mb-1">
                          {redemption.reward?.reward_name || 'Unknown Reward'}
                        </h4>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Quantity:</span>
                            <span className="font-semibold">{redemption.quantity}x</span>
                          </span>
                          
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Total Cost:</span>
                            <span className="font-semibold text-blue-600">
                              {formatNumber(redemption.points_spent)} points
                            </span>
                          </span>
                          
                          <span className="flex items-center gap-1 text-gray-500">
                            <CalendarIcon className="h-4 w-4" />
                            {formatDate(redemption.redeemed_at)}
                          </span>
                        </div>
                        
                        {redemption.shipping_notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Catatan:</span> {redemption.shipping_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div className="flex flex-col items-end gap-2">
                    <div className={`
                      px-3 py-1 rounded-full text-xs font-medium border
                      ${STATUS_COLORS[redemption.status] || STATUS_COLORS['menunggu_verifikasi']}
                    `}>
                      <div className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {STATUS_LABELS[redemption.status] || redemption.status}
                      </div>
                    </div>
                    
                    {redemption.shipped_at && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span>Dikirim:</span>
                        <span>{formatDate(redemption.shipped_at)}</span>
                      </div>
                    )}
                    
                    {redemption.delivered_at && (
                      <div className={`text-xs flex items-center gap-1 ${
                        redemption.status === 'ditolak' 
                          ? 'text-red-600' 
                          : redemption.status === 'diterima'
                          ? 'text-green-600'
                          : 'text-green-600'
                      }`}>
                        {redemption.status === 'ditolak' ? (
                          <XCircleIcon className="h-3 w-3" />
                        ) : (
                          <CheckCircleIcon className="h-3 w-3" />
                        )}
                        <span>
                          {redemption.status === 'ditolak' ? 'Ditolak:' : 'Diterima:'}
                        </span>
                        <span>{formatDate(redemption.delivered_at)}</span>
                      </div>
                    )}
                    
                    {/* Tombol konfirmasi untuk status "dikirim" */}
                    {redemption.status === 'dikirim' && redemption.shipped_at && (
                      <button
                        onClick={() => handleConfirmReceived(redemption)}
                        className="mt-2 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                      >
                        <CheckCircleIcon className="h-3 w-3" />
                        Konfirmasi Diterima
                      </button>
                    )}
                  </div>
                </div>
                
                {redemption.redemption_notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">Ulasan User:</span> {redemption.redemption_notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Modal Konfirmasi Barang Diterima - Centered in viewport */}
      {showConfirmModal && selectedRedemption && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div 
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Konfirmasi Barang Diterima</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal content */}
            <div className="p-6">
              <p className="text-gray-600 mb-4 text-center">
                Konfirmasi bahwa Anda telah menerima hadiah ini?
              </p>
              
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  {selectedRedemption.reward?.foto_url ? (
                    <img
                      src={selectedRedemption.reward.foto_url}
                      alt={selectedRedemption.reward.reward_name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-200/50 to-purple-200/50 rounded-lg flex items-center justify-center">
                      <GiftIcon className="h-6 w-6 text-blue-500" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {selectedRedemption.reward?.reward_name || 'Unknown Reward'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Quantity: {selectedRedemption.quantity}x
                    </p>
                    <p className="text-sm text-gray-600">
                      Dikirim: {formatDate(selectedRedemption.shipped_at)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Review Form */}
              <div className="mb-4 bg-white/50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ulasan & Rating Produk (Opsional)
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Bagaimana pengalaman Anda dengan produk ini? Berikan ulasan untuk membantu pengguna lain..."
                  maxLength="500"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    Ulasan Anda akan membantu meningkatkan kualitas layanan kami
                  </p>
                  <p className="text-xs text-gray-400">
                    {reviewText.length}/500
                  </p>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <div className="flex items-start gap-2">
                  <div className="text-yellow-600">
                    <svg className="w-4 h-4 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Konfirmasi Penerimaan</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Status akan berubah menjadi "Diterima" dan tidak dapat diubah lagi.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={submitting}
                  className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={submitConfirmation}
                  disabled={submitting}
                  className="flex-1 py-3 px-4 rounded-xl text-white font-bold transition-all duration-200 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Memproses...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircleIcon className="h-4 w-4" />
                      Konfirmasi Diterima
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}