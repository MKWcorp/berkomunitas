'use client';
import { useState, useEffect } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, CalendarIcon, UserIcon, ChartBarIcon, CurrencyDollarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import AdminLayout from '../components/AdminLayout';
import GlassCard from '../../components/GlassCard';
import AdminModal from '../components/AdminModal';

export default function PointsPage() {
  const { user, isLoaded } = useSSOUser();
  const router = useRouter();
  
  const [history, setHistory] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberStats, setMemberStats] = useState([]);
  const [memberStatsSort, setMemberStatsSort] = useState({ field: 'loyalty_point', direction: 'desc' });
  const [memberStatsSearch, setMemberStatsSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditLoyaltyModal, setShowEditLoyaltyModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editLoyaltyForm, setEditLoyaltyForm] = useState({
    points: '',
    reason: '',
    type: 'add' // 'add' atau 'subtract'
  });

  // Validation helpers
  const isReasonValid = (reason) => {
    return reason && reason.trim().length >= 5;
  };

  const isPointsValid = (points) => {
    return points && !isNaN(points) && Number(points) > 0;
  };

  // Number formatting helper
  const formatNumber = (number) => {
    if (number === null || number === undefined) return '0';
    return Number(number).toLocaleString('id-ID');
  };
  const [filters, setFilters] = useState({
    search: '',
    eventType: '',
    startDate: '',
    endDate: ''
  });

  const eventTypes = [
    { value: '', label: 'Semua Event' },
    { value: 'comment', label: 'Komentar' },
    { value: 'task_completion', label: 'Penyelesaian Tugas' },
    { value: 'badge_earned', label: 'Badge Diperoleh' },
    { value: 'level_up', label: 'Naik Level' },
    { value: 'bonus', label: 'Bonus' },
    { value: 'penalty', label: 'Penalti' }
  ];

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user?.email) {
      router.push('/sign-in');
      return;
    }

    // Check admin privileges first
    fetch('/api/admin/check-status', {
      method: 'GET',
      credentials: 'include'
    })
    .then(res => res.json())
    .then(privilegeData => {
      if (privilegeData.success && privilegeData.isAdmin) {
        setIsAdmin(true);
        fetchData();
      } else {
        router.push('/');
      }
    })
    .catch(error => {
      console.error('Admin check error:', error);
      router.push('/');
    });
  }, [isLoaded, user, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.eventType) params.append('eventType', filters.eventType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/admin/points?${params}`, {
        headers: { 'x-user-email': user?.email }
      });

      if (response.ok) {
        const result = await response.json();
        setHistory(result.data.history || []);
        setMembers(result.data.members || []);
        setMemberStats(result.data.memberStats || []);
      } else {
        setHistory([]);
        setMembers([]);
        setMemberStats([]);
      }
    } catch (error) {
      console.error('Error fetching points data:', error);
      setHistory([]);
      setMembers([]);
      setMemberStats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearchFilter = () => {
    fetchData();
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      eventType: '',
      startDate: '',
      endDate: ''
    });
    setTimeout(() => {
      fetchData();
    }, 100);
  };

  const handleRowClick = (member) => {
    setSelectedMember(member);
    setEditLoyaltyForm({
      points: '',
      reason: '',
      type: 'add'
    });
    setShowEditLoyaltyModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    // Strict validation for required fields
    if (!editLoyaltyForm.points || isNaN(editLoyaltyForm.points) || editLoyaltyForm.points <= 0) {
      alert('Jumlah poin harus diisi dengan angka positif yang valid!');
      return;
    }
    
    if (!editLoyaltyForm.reason || editLoyaltyForm.reason.trim().length < 5) {
      alert('Alasan wajib diisi minimal 5 karakter dan tidak boleh kosong!');
      return;
    }

    // Additional validation for subtract operation
    if (editLoyaltyForm.type === 'subtract') {
      const pointsToSubtract = Math.abs(Number(editLoyaltyForm.points));
      const currentLoyalty = selectedMember.loyalty_point || 0;
      
      if (pointsToSubtract > currentLoyalty) {
        alert(`❌ TIDAK BISA KURANGI: Member ${selectedMember.nama_lengkap} hanya memiliki ${formatNumber(currentLoyalty)} loyalty points. Anda mencoba mengurangi ${formatNumber(pointsToSubtract)} points.`);
        return;
      }
    }

    try {
      const pointsToAdd = editLoyaltyForm.type === 'subtract' 
        ? -Math.abs(Number(editLoyaltyForm.points))
        : Math.abs(Number(editLoyaltyForm.points));

      const response = await fetch('/api/admin/points/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email
        },
        body: JSON.stringify({
          member_id: selectedMember.id,
          points: pointsToAdd,
          reason: editLoyaltyForm.reason.trim()
        })
      });

      if (response.ok) {
        setShowEditLoyaltyModal(false);
        setSelectedMember(null);
        setEditLoyaltyForm({ points: '', reason: '', type: 'add' });
        fetchData();
        alert(`Loyalty berhasil ${editLoyaltyForm.type === 'add' ? 'ditambahkan' : 'dikurangi'}!`);
      } else {
        const errorData = await response.json();
        if (response.status === 400 && errorData.error.includes('hanya memiliki')) {
          alert(`❌ GAGAL: ${errorData.error}`);
        } else {
          alert(errorData.error || 'Gagal mengupdate loyalty');
        }
      }
    } catch (error) {
      console.error('Error updating loyalty:', error);
      alert('Terjadi kesalahan saat mengupdate loyalty');
    }
  };

  const getEventTypeLabel = (eventType) => {
    const type = eventTypes.find(t => t.value === eventType);
    return type ? type.label : eventType;
  };

  const getEventTypeColor = (eventType) => {
    switch (eventType) {
      case 'comment':
        return 'bg-blue-100 text-blue-800';
      case 'task_completion':
        return 'bg-green-100 text-green-800';
      case 'badge_earned':
        return 'bg-purple-100 text-purple-800';
      case 'level_up':
        return 'bg-yellow-100 text-yellow-800';
      case 'bonus':
        return 'bg-emerald-100 text-emerald-800';
      case 'penalty':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID');
  };

  const calculateTotalPoints = () => {
    // Calculate total loyalty points including negative values (as per business logic)
    return members.reduce((total, member) => total + (member.loyalty_point || 0), 0);
  };

  const sortMemberStats = (field) => {
    const direction = memberStatsSort.field === field && memberStatsSort.direction === 'asc' ? 'desc' : 'asc';
    setMemberStatsSort({ field, direction });
  };

  const getFilteredAndSortedMemberStats = () => {
    let filtered = memberStats;
    
    if (memberStatsSearch) {
      filtered = filtered.filter(member => 
        member.nama_lengkap && member.nama_lengkap.toLowerCase().includes(memberStatsSearch.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      const { field, direction } = memberStatsSort;
      let aValue = a[field];
      let bValue = b[field];

      // Handle null values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    }).slice(0, 10); // Limit to 10 members
  };

  const getSortIcon = (field) => {
    if (memberStatsSort.field !== field) return '↕️';
    return memberStatsSort.direction === 'asc' ? '↑' : '↓';
  };

  if (!isLoaded || loading) {
    return (
      <AdminLayout>
        <GlassCard className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-700">Memuat data monitoring poin...</div>
        </GlassCard>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout>
        <GlassCard className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <div className="text-red-700">Akses Ditolak</div>
        </GlassCard>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <GlassCard className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Monitoring Loyalitas</h2>
          </div>
        </GlassCard>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <GlassCard className="text-center">
            <CurrencyDollarIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-600">Total Loyalty</div>
            <div className="text-2xl font-bold text-gray-800">{formatNumber(calculateTotalPoints())}</div>
          </GlassCard>

          <GlassCard className="text-center">
            <UserIcon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-600">Total Member</div>
            <div className="text-2xl font-bold text-gray-800">{members.length}</div>
          </GlassCard>

          <GlassCard className="text-center">
            <ChartBarIcon className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-600">Rata-rata</div>
            <div className="text-2xl font-bold text-gray-800">
              {history.length > 0 ? formatNumber(Math.round(calculateTotalPoints() / history.length)) : 0}
            </div>
          </GlassCard>

          <GlassCard className="text-center">
            <UserIcon className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-600">Aktif Member</div>
            <div className="text-2xl font-bold text-gray-800">{memberStats.length}</div>
          </GlassCard>
        </div>

        {/* Member Statistics Table */}
        <GlassCard className="mb-6">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-800">Statistik Member</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Menampilkan 10 dari {memberStats.length} member
                  {memberStatsSearch && ` untuk "${memberStatsSearch}"`}
                </p>
              </div>
              <div className="relative w-64">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={memberStatsSearch}
                  onChange={(e) => setMemberStatsSearch(e.target.value)}
                  placeholder="Cari member..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" 
                    onClick={() => sortMemberStats('id')}
                  >
                    ID Member <span className="ml-1">{getSortIcon('id')}</span>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" 
                    onClick={() => sortMemberStats('nama_lengkap')}
                  >
                    Nama Member <span className="ml-1">{getSortIcon('nama_lengkap')}</span>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" 
                    onClick={() => sortMemberStats('jumlah_komentar')}
                  >
                    Jumlah Komentar <span className="ml-1">{getSortIcon('jumlah_komentar')}</span>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" 
                    onClick={() => sortMemberStats('jumlah_tugas_selesai')}
                  >
                    Jumlah Tugas Diselesaikan <span className="ml-1">{getSortIcon('jumlah_tugas_selesai')}</span>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" 
                    onClick={() => sortMemberStats('loyalty_point')}
                  >
                    Loyalty <span className="ml-1">{getSortIcon('loyalty_point')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredAndSortedMemberStats().length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <UserIcon className="h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-lg font-medium mb-1">Tidak ada data member</p>
                        <p className="text-sm">Belum ada member yang terdaftar atau data tidak sesuai filter</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  getFilteredAndSortedMemberStats().map((member, index) => (
                    <tr 
                      key={member.id} 
                      className={`hover:bg-blue-50 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      onClick={() => handleRowClick(member)}
                      title="Klik untuk edit loyalty member ini"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{member.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.nama_lengkap || 'Nama tidak tersedia'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          💬 {formatNumber(member.jumlah_komentar || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ {formatNumber(member.jumlah_tugas_selesai || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          ⭐ {formatNumber(member.loyalty_point || 0)} poin
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Filters Section */}
        <GlassCard className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Filter Data Riwayat Transaksi</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cari Member
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Nama member..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipe Event
              </label>
              <select
                value={filters.eventType}
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleSearchFilter}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
              Cari & Filter
            </button>
            <button
              onClick={handleClearFilters}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        </GlassCard>

        {/* History Table */}
        <GlassCard>
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h3 className="text-lg font-medium text-gray-800">Riwayat Transaksi Poin</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Poin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.members?.nama_lengkap || 'Unknown Member'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.members?.member_emails?.[0]?.email || '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.event || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(item.event_type)}`}>
                        {getEventTypeLabel(item.event_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${item.point >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.point >= 0 ? '+' : ''}{formatNumber(item.point)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(item.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {history.length === 0 && (
              <div className="text-center py-12">
                <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500">Tidak ada data transaksi poin</div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Edit Loyalty Modal */}
        <AdminModal
          isOpen={showEditLoyaltyModal}
          onClose={() => setShowEditLoyaltyModal(false)}
          title={`Edit Loyalty - ${selectedMember?.nama_lengkap}`}
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Member Info:</div>
              <div className="text-lg font-medium text-gray-900">{selectedMember?.nama_lengkap}</div>
              <div className="text-sm text-gray-500">ID: {selectedMember?.id}</div>
              <div className="text-sm text-blue-600 font-medium">
                Current Loyalty: {formatNumber(selectedMember?.loyalty_point || 0)} loyalty
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipe Transaksi
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="add"
                    checked={editLoyaltyForm.type === 'add'}
                    onChange={(e) => setEditLoyaltyForm({ ...editLoyaltyForm, type: e.target.value })}
                    className="mr-2"
                  />
                  <span className="text-green-600">➕ Tambah Loyalty</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="subtract"
                    checked={editLoyaltyForm.type === 'subtract'}
                    onChange={(e) => setEditLoyaltyForm({ ...editLoyaltyForm, type: e.target.value })}
                    className="mr-2"
                  />
                  <span className="text-red-600">➖ Kurangi Loyalty</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jumlah Loyalty
              </label>
              <input
                type="number"
                value={editLoyaltyForm.points}
                onChange={(e) => setEditLoyaltyForm({ ...editLoyaltyForm, points: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan jumlah loyalty..."
                min="1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Masukkan nilai positif. Tipe transaksi menentukan apakah loyalty ditambah atau dikurangi.
                {editLoyaltyForm.type === 'subtract' && (
                  <span className="block text-red-600 font-medium mt-1">
                    ⚠️ PERHATIAN: Current loyalty = {formatNumber(selectedMember?.loyalty_point || 0)} loyalty. 
                    Max pengurangan = {formatNumber(selectedMember?.loyalty_point || 0)} loyalty.
                  </span>
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-red-500">*</span> Alasan (Wajib)
              </label>
              <textarea
                value={editLoyaltyForm.reason}
                onChange={(e) => setEditLoyaltyForm({ ...editLoyaltyForm, reason: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  editLoyaltyForm.reason.length === 0 ? 'border-gray-300 focus:ring-blue-500' :
                  isReasonValid(editLoyaltyForm.reason) ? 'border-green-300 focus:ring-green-500' : 'border-red-300 focus:ring-red-500'
                }`}
                rows="3"
                placeholder="Jelaskan alasan perubahan loyalty (minimal 5 karakter)..."
                required
                minLength={5}
              />
              <p className={`text-xs mt-1 ${
                editLoyaltyForm.reason.length === 0 ? 'text-red-500' :
                isReasonValid(editLoyaltyForm.reason) ? 'text-green-600' : 'text-red-500'
              }`}>
                <strong>WAJIB:</strong> Alasan harus diisi minimal 5 karakter untuk audit trail
                {editLoyaltyForm.reason.length > 0 && (
                  <span className="ml-2">
                    ({editLoyaltyForm.reason.trim().length}/5 karakter)
                    {isReasonValid(editLoyaltyForm.reason) && " ✓"}
                  </span>
                )}
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={() => setShowEditLoyaltyModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!isPointsValid(editLoyaltyForm.points) || !isReasonValid(editLoyaltyForm.reason)}
                className={`flex-1 px-4 py-2 text-white rounded-md transition-colors ${
                  !isPointsValid(editLoyaltyForm.points) || !isReasonValid(editLoyaltyForm.reason)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : editLoyaltyForm.type === 'add' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {editLoyaltyForm.type === 'add' ? '➕ Tambah Poin' : '➖ Kurangi Poin'}
              </button>
            </div>
          </form>
        </AdminModal>
      </div>
    </AdminLayout>
  );
}
