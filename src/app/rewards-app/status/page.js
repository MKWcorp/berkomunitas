'use client';
import { useState, useEffect } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { 
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../components/GlassCard';
import AdminModal from '../../admin-app/components/AdminModal';
import ShippingTracker from '../../../components/ShippingTracker';

export default function RedemptionStatusPage() {
  const { user } = useSSOUser();
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'redeemed_at',
    direction: 'desc'
  });
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState(null);
  const [updateData, setUpdateData] = useState({
    status: '',
    notes: '', // untuk redemption_notes
    redemptionNotes: '', // untuk shipping_notes
    tracking_number: ''
  });
  const [updating, setUpdating] = useState(false);

  const filterOptions = [
    { value: 'all', label: 'Semua Status', count: 0 },
    { value: 'menunggu_verifikasi', label: 'Menunggu Verifikasi', count: 0 },
    { value: 'dikirim', label: 'Dikirim', count: 0 },
    { value: 'diterima', label: 'Diterima', count: 0 }
  ];

  useEffect(() => {
    loadRedemptions();
  }, [user]);

  const loadRedemptions = async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/admin/redemptions');
      
      if (response.ok) {
        const data = await response.json();
        setRedemptions(data.data || []);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Gagal memuat riwayat penukaran hadiah');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat riwayat penukaran hadiah');
    } finally {
      setLoading(false);
    }
  };

  // Filter redemptions
  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return '↕️'; // Neutral sort icon
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Filter and sort redemptions
  const filteredAndSortedRedemptions = redemptions
    .filter(redemption => {
      // Status filter
      const statusMatch = filter === 'all' || redemption.status === filter;
      
      // Search filter
      const searchMatch = !searchTerm || 
        (redemption.reward_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (redemption.member_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (redemption.redemption_notes?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (redemption.status?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return statusMatch && searchMatch;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Handle different data types
      if (sortConfig.key === 'redeemed_at' || sortConfig.key === 'created_at') {
        aValue = new Date(a.redeemed_at || a.created_at);
        bValue = new Date(b.redeemed_at || b.created_at);
      } else if (sortConfig.key === 'point_cost') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      } else if (sortConfig.key === 'quantity') {
        aValue = parseInt(aValue) || 1;
        bValue = parseInt(bValue) || 1;
      } else if (typeof aValue === 'string') {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

  // Update filter counts
  const updatedFilterOptions = filterOptions.map(option => ({
    ...option,
    count: option.value === 'all' 
      ? redemptions.length 
      : redemptions.filter(r => r.status === option.value).length
  }));

  const getStatusConfig = (status) => {
    const configs = {
      'menunggu_verifikasi': {
        icon: ClockIcon,
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        text: 'Menunggu Verifikasi'
      },
      'dikirim': {
        icon: TruckIcon,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        text: 'Dikirim'
      },
      'diterima': {
        icon: CheckCircleIcon,
        color: 'text-green-600 bg-green-50 border-green-200',
        text: 'Diterima'
      },
      'ditolak': {
        icon: XCircleIcon,
        color: 'text-red-600 bg-red-50 border-red-200',
        text: 'Ditolak'
      }
    };
    
    return configs[status] || configs.menunggu_verifikasi;
  };

  const handleShowDetail = (redemption) => {
    setSelectedRedemption(redemption);
    setUpdateData({
      status: redemption.status,
      notes: redemption.redemption_notes || '', // Keterangan
      redemptionNotes: redemption.shipping_notes || '', // Catatan Redem
      tracking_number: redemption.tracking_number || ''
    });
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedRedemption) return;
    
    // Validasi wajib isi keterangan untuk semua status
    if (!updateData.notes.trim()) {
      alert('Keterangan wajib diisi untuk update status');
      return;
    }

    // Cek jika status sudah final (tidak bisa diubah)
    const finalStatuses = ['diterima', 'ditolak'];
    if (finalStatuses.includes(selectedRedemption.status)) {
      alert(`Status "${selectedRedemption.status.toUpperCase()}" sudah final dan tidak dapat diubah lagi.`);
      return;
    }

    // Konfirmasi untuk status final
    let confirmFinal = false;
    if (finalStatuses.includes(updateData.status)) {
      const statusText = updateData.status === 'diterima' ? 'DITERIMA' : 'DITOLAK';
      const confirmMessage = `⚠️ KONFIRMASI PENTING ⚠️\n\nAnda akan mengubah status menjadi "${statusText}"\n\nStatus ini akan menjadi FINAL dan TIDAK DAPAT DIUBAH LAGI!\n\nPastikan keputusan Anda sudah benar.\n\nLanjutkan?`;
      
      confirmFinal = confirm(confirmMessage);
      if (!confirmFinal) {
        return;
      }
    }
    
    try {
      setUpdating(true);
      
      const requestBody = {
        status: updateData.status,
        shipping_notes: updateData.redemptionNotes, // Catatan Redem
        redemption_notes: updateData.notes // Keterangan
      };

      // Tambahkan confirmFinal jika status final
      if (finalStatuses.includes(updateData.status)) {
        requestBody.confirmFinal = confirmFinal;
      }
      
      const response = await fetch(`/api/admin/redemptions/${selectedRedemption.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        await loadRedemptions();
        setShowDetailModal(false);
        setSelectedRedemption(null);
        
        if (finalStatuses.includes(updateData.status)) {
          alert(`✅ Status berhasil diubah menjadi "${updateData.status.toUpperCase()}".\n\nStatus ini sekarang final dan tidak dapat diubah lagi.`);
        } else {
          alert('Status berhasil diperbarui');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Gagal memperbarui status');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat memperbarui status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <ClockIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Status Penukaran</h1>
              <p className="text-purple-100">Kelola riwayat penukaran hadiah</p>
            </div>
          </div>
        </div>
        
        <GlassCard className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-gray-700 text-lg">Memuat riwayat penukaran...</div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <ClockIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Status Penukaran</h1>
              <p className="text-purple-100">Kelola riwayat penukaran hadiah</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <GlassCard>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari berdasarkan hadiah, member, catatan, atau status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
            </div>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </GlassCard>

      {/* Search Results Indicator */}
      {(searchTerm || filter !== 'all') && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-blue-800">
                Menampilkan {filteredAndSortedRedemptions.length} hasil
                {searchTerm && ` untuk "${searchTerm}"`}
                {filter !== 'all' && ` dengan status "${filter}"`}
              </div>
              {(searchTerm || filter !== 'all') && (
                <div className="text-xs text-blue-600 mt-1">
                  dari total {redemptions.length} penukaran
                </div>
              )}
            </div>
          </div>
          {(searchTerm || filter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilter('all');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 underline transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      )}

      {/* Filter Cards - Clickable Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {updatedFilterOptions.slice(1).map((stat, index) => {
          const colors = ['yellow', 'blue', 'green'];
          const color = colors[index] || 'gray';
          const isActive = filter === stat.value;
          
          return (
            <button
              key={stat.value}
              onClick={() => setFilter(filter === stat.value ? 'all' : stat.value)}
              className="text-left"
            >
              <GlassCard className={`p-4 transition-all duration-200 hover:shadow-lg transform hover:scale-105 ${
                isActive ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`${isActive ? 'bg-blue-100' : `bg-${color}-100`} p-2 rounded-lg`}>
                    {stat.value === 'menunggu_verifikasi' && <ClockIcon className={`w-5 h-5 ${isActive ? 'text-blue-600' : `text-${color}-600`}`} />}
                    {stat.value === 'dikirim' && <TruckIcon className={`w-5 h-5 ${isActive ? 'text-blue-600' : `text-${color}-600`}`} />}
                    {stat.value === 'diterima' && <CheckCircleIcon className={`w-5 h-5 ${isActive ? 'text-blue-600' : `text-${color}-600`}`} />}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{stat.count}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                </div>
              </GlassCard>
            </button>
          );
        })}
        
        {/* Total Penukaran Card - Also clickable */}
        <button
          onClick={() => setFilter(filter === 'all' ? 'all' : 'all')}
          className="text-left"
        >
          <GlassCard className={`p-4 transition-all duration-200 hover:shadow-lg transform hover:scale-105 ${
            filter === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`${filter === 'all' ? 'bg-blue-100' : 'bg-purple-100'} p-2 rounded-lg`}>
                <InformationCircleIcon className={`w-5 h-5 ${filter === 'all' ? 'text-blue-600' : 'text-purple-600'}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{redemptions.length}</div>
                <div className="text-sm text-gray-600">Total Penukaran</div>
              </div>
            </div>
          </GlassCard>
        </button>
      </div>

      {/* Redemptions Table */}
      <GlassCard className="overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <ClockIcon className="w-5 h-5 mr-2" />
            Riwayat Penukaran Hadiah
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg m-4">
            {error}
          </div>
        )}
        
        {filteredAndSortedRedemptions.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 
                'Tidak ada hasil ditemukan' : 
                filter === 'all' ? 
                  'Belum ada penukaran hadiah' : 
                  `Tidak ada penukaran dengan status "${updatedFilterOptions.find(f => f.value === filter)?.label}"`
              }
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 
                `Tidak ada penukaran yang cocok dengan pencarian "${searchTerm}"` :
                filter === 'all' ? 
                  'Penukaran hadiah akan muncul di sini' : 
                  'Coba ubah filter untuk melihat penukaran lainnya'
              }
            </p>
            {(searchTerm || filter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Lihat Semua Penukaran
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('reward_name')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Reward</span>
                      <span className="text-sm">{getSortIcon('reward_name')}</span>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('quantity')}
                      className="flex items-center justify-center space-x-1 hover:text-gray-700 transition-colors w-full"
                    >
                      <span>Jumlah</span>
                      <span className="text-sm">{getSortIcon('quantity')}</span>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('member_name')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Nama</span>
                      <span className="text-sm">{getSortIcon('member_name')}</span>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('redeemed_at')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Waktu</span>
                      <span className="text-sm">{getSortIcon('redeemed_at')}</span>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('redemption_notes')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Catatan</span>
                      <span className="text-sm">{getSortIcon('redemption_notes')}</span>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center justify-center space-x-1 hover:text-gray-700 transition-colors w-full"
                    >
                      <span>Status</span>
                      <span className="text-sm">{getSortIcon('status')}</span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedRedemptions.map((redemption) => {
                  const statusConfig = getStatusConfig(redemption.status);
                  
                  return (
                    <tr 
                      key={redemption.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleShowDetail(redemption)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {redemption.reward_name || 'Hadiah tidak diketahui'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {(redemption.point_cost || 0).toLocaleString()} poin
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {redemption.quantity || 1}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {redemption.member_name || 'User tidak diketahui'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(redemption.redeemed_at || redemption.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(redemption.redeemed_at || redemption.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-[150px] truncate" title={redemption.redemption_notes || '-'}>
                          {redemption.redemption_notes || '-'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Detail Modal */}
      <AdminModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detail Penukaran Hadiah"
        closeOnBackdropClick={false}
      >
        {selectedRedemption && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Informasi Hadiah</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Nama Hadiah:</strong> {selectedRedemption.reward_name}</p>
                  <p><strong>Jumlah:</strong> {selectedRedemption.quantity || 1}</p>
                  <p><strong>Coin Terpakai:</strong> {selectedRedemption.point_cost?.toLocaleString()} coin</p>
                  <p><strong>Tanggal Penukaran:</strong> {new Date(selectedRedemption.redeemed_at || selectedRedemption.created_at).toLocaleDateString('id-ID')}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Informasi Pengguna</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Nama:</strong> {selectedRedemption.member_name}</p>
                  <p><strong>WhatsApp:</strong> {selectedRedemption.member_wa || 'Tidak tersedia'}</p>
                </div>
              </div>
            </div>
            
            {/* Catatan Redem */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Catatan Redem:
              </label>
              <textarea
                value={updateData.redemptionNotes}
                onChange={(e) => setUpdateData(prev => ({ ...prev, redemptionNotes: e.target.value }))}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                placeholder="Catatan khusus untuk redemption ini..."
              />
            </div>
            
            {/* Admin Status Update */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-4">Update Status</h4>
              
              {/* Warning untuk status final */}
              {['diterima', 'ditolak'].includes(selectedRedemption?.status) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <div className="text-red-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Status Final</h3>
                      <p className="mt-1 text-sm text-red-600">
                        Status "{selectedRedemption.status.toUpperCase()}" sudah final dan tidak dapat diubah lagi.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status Penukaran
                  </label>
                  <select
                    value={updateData.status}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                    disabled={['diterima', 'ditolak'].includes(selectedRedemption?.status)}
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      ['diterima', 'ditolak'].includes(selectedRedemption?.status) 
                        ? 'bg-gray-100 cursor-not-allowed text-gray-500' 
                        : ''
                    }`}
                  >
                    <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
                    <option value="dikirim">Dikirim</option>
                    <option value="diterima">Diterima</option>
                    <option value="ditolak">Ditolak</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keterangan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={updateData.notes}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Keterangan wajib diisi untuk update status"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Keterangan akan disimpan sebagai catatan pengiriman
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={updating}
                  >
                    Tutup
                  </button>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={
                      updating || 
                      !updateData.notes.trim() || 
                      ['diterima', 'ditolak'].includes(selectedRedemption?.status)
                    }
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <span>
                      {updating 
                        ? 'Menyimpan...' 
                        : ['diterima', 'ditolak'].includes(selectedRedemption?.status)
                        ? 'Status Final'
                        : 'Update Status'
                      }
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}