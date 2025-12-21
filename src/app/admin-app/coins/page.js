'use client';
import { useState, useEffect } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, CalendarIcon, UserIcon, ChartBarIcon, CurrencyDollarIcon, ExclamationTriangleIcon, CircleStackIcon } from '@heroicons/react/24/outline';
import AdminLayout from '../components/AdminLayout';
import GlassCard from '../../components/GlassCard';
import AdminModal from '../components/AdminModal';

export default function CoinsPage() {
  const { user, isLoaded } = useSSOUser();
  const router = useRouter();
  
  const [history, setHistory] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberStats, setMemberStats] = useState([]);
  const [memberStatsSort, setMemberStatsSort] = useState({ field: 'coin', direction: 'desc' });
  const [memberStatsSearch, setMemberStatsSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditCoinModal, setShowEditCoinModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editCoinForm, setEditCoinForm] = useState({
    coins: '',
    reason: '',
    type: 'add' // 'add' atau 'subtract'
  });

  // Validation helpers
  const isReasonValid = (reason) => {
    return reason && reason.trim().length >= 5;
  };

  const isCoinsValid = (coins) => {
    return coins && !isNaN(coins) && Number(coins) > 0;
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
    { value: 'redemption', label: 'Penukaran Hadiah' },
    { value: 'bonus', label: 'Bonus' },
    { value: 'penalty', label: 'Penalti' },
    { value: 'admin_manual', label: 'Admin Manual' }
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

      const response = await fetch(`/api/admin/coins?${params}`, {
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
      console.error('Error fetching coin data:', error);
      setHistory([]);
      setMembers([]);
      setMemberStats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoints = async (e) => {
    e.preventDefault();
    
    // This function is for future implementation of bulk add
    // For now, we use the click-to-edit functionality
  };

  const handleRowClick = (member) => {
    setSelectedMember(member);
    setEditCoinForm({
      coins: '',
      reason: '',
      type: 'add'
    });
    setShowEditCoinModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    // Strict validation for required fields
    if (!editCoinForm.coins || isNaN(editCoinForm.coins) || editCoinForm.coins <= 0) {
      alert('Jumlah coin harus diisi dengan angka positif yang valid!');
      return;
    }
    
    if (!editCoinForm.reason || editCoinForm.reason.trim().length < 5) {
      alert('Alasan wajib diisi minimal 5 karakter dan tidak boleh kosong!');
      return;
    }

    // Additional validation for subtract operation
    if (editCoinForm.type === 'subtract') {
      const coinsToSubtract = Math.abs(Number(editCoinForm.coins));
      const currentCoins = selectedMember.coin || 0;
      
      if (coinsToSubtract > currentCoins) {
        alert(`❌ TIDAK BISA KURANGI: Member ${selectedMember.nama_lengkap} hanya memiliki ${formatNumber(currentCoins)} coins. Anda mencoba mengurangi ${formatNumber(coinsToSubtract)} coins.`);
        return;
      }
    }

    try {
      const coinsToAdd = editCoinForm.type === 'subtract' 
        ? -Math.abs(Number(editCoinForm.coins))
        : Math.abs(Number(editCoinForm.coins));

      const response = await fetch('/api/admin/coins/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email
        },
        body: JSON.stringify({
          member_id: selectedMember.id,
          coins: coinsToAdd,
          reason: editCoinForm.reason.trim()
        })
      });

      if (response.ok) {
        setShowEditCoinModal(false);
        setSelectedMember(null);
        setEditCoinForm({ coins: '', reason: '', type: 'add' });
        fetchData();
        alert(`Coins berhasil ${editCoinForm.type === 'add' ? 'ditambahkan' : 'dikurangi'}!`);
      } else {
        const errorData = await response.json();
        if (response.status === 400 && errorData.error.includes('hanya memiliki')) {
          alert(`❌ GAGAL: ${errorData.error}`);
        } else {
          alert(errorData.error || 'Gagal mengupdate coins');
        }
      }
    } catch (error) {
      console.error('Error updating coins:', error);
      alert('Terjadi kesalahan saat mengupdate coins');
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
      case 'redemption':
        return 'bg-purple-100 text-purple-800';
      case 'bonus':
        return 'bg-emerald-100 text-emerald-800';
      case 'penalty':
        return 'bg-red-100 text-red-800';
      case 'admin_manual':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID');
  };

  const calculateTotalCoins = () => {
    // Calculate total coins including negative values (as per business logic)
    return members.reduce((total, member) => total + (member.coin || 0), 0);
  };

  const sortMemberStats = (field) => {
    const direction = memberStatsSort.field === field && memberStatsSort.direction === 'asc' ? 'desc' : 'asc';
    setMemberStatsSort({ field, direction });
  };

  const getSortIcon = (field) => {
    if (memberStatsSort.field !== field) return '↕️';
    return memberStatsSort.direction === 'asc' ? '⬆️' : '⬇️';
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

  if (loading) {
    return (
      <AdminLayout>
        <GlassCard className="text-center py-8">
          <div className="text-gray-700">Loading...</div>
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
            <h2 className="text-2xl font-bold text-gray-800">Monitoring Coins</h2>
          </div>
        </GlassCard>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <GlassCard className="text-center">
            <CircleStackIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-600">Total Coins</div>
            <div className="text-2xl font-bold text-gray-800">{formatNumber(calculateTotalCoins())}</div>
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
              {members.length > 0 ? formatNumber(Math.round(calculateTotalCoins() / members.length)) : 0}
            </div>
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
                    onClick={() => sortMemberStats('coin')}
                  >
                    Coins <span className="ml-1">{getSortIcon('coin')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredAndSortedMemberStats().length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <UserIcon className="h-12 w-12 text-gray-300 mb-4" />
                        <div className="text-gray-500">
                          {memberStatsSearch ? `Tidak ada member dengan nama "${memberStatsSearch}"` : 'Tidak ada data member'}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  getFilteredAndSortedMemberStats().map((member, index) => (
                    <tr 
                      key={member.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors" 
                      onClick={() => handleRowClick(member)}
                      title="Click to edit coins"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {member.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {member.nama_lengkap || 'Nama tidak tersedia'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (member.coin || 0) > 0 
                            ? 'bg-green-100 text-green-800' 
                            : (member.coin || 0) < 0 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {formatNumber(member.coin || 0)} coins
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Filter & History */}
        <GlassCard className="mb-6">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h3 className="text-lg font-medium text-gray-800">History Coins</h3>
          </div>
          
          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Cari member..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filters.eventType}
              onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {eventTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <div className="relative">
              <CalendarIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <CalendarIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={fetchData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Filter
            </button>
            <button
              onClick={() => {
                setFilters({ search: '', eventType: '', startDate: '', endDate: '' });
                fetchData();
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Reset
            </button>
          </div>

          {/* History Table */}
          <div className="overflow-x-auto">
            {history.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Tidak ada data transaksi coins</div>
              </div>
            ) : (
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
                      Coins
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipe
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.member_name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{item.event}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.coin > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.coin > 0 ? '+' : ''}{formatNumber(item.coin)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEventTypeColor(item.event_type)}`}>
                          {getEventTypeLabel(item.event_type)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </GlassCard>

        {/* Edit Coins Modal */}
        <AdminModal
          isOpen={showEditCoinModal}
          onClose={() => setShowEditCoinModal(false)}
          title={`Edit Coins - ${selectedMember?.nama_lengkap}`}
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Member Info:</div>
              <div className="text-lg font-medium text-gray-900">{selectedMember?.nama_lengkap}</div>
              <div className="text-sm text-gray-500">ID: {selectedMember?.id}</div>
              <div className="text-sm text-green-600 font-medium">
                Current Coins: {formatNumber(selectedMember?.coin || 0)} coins
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipe Operasi
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="add"
                    checked={editCoinForm.type === 'add'}
                    onChange={(e) => setEditCoinForm({ ...editCoinForm, type: e.target.value })}
                    className="mr-2"
                  />
                  <span className="text-green-600 font-medium">➕ Tambah Coins</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="subtract"
                    checked={editCoinForm.type === 'subtract'}
                    onChange={(e) => setEditCoinForm({ ...editCoinForm, type: e.target.value })}
                    className="mr-2"
                  />
                  <span className="text-red-600 font-medium">➖ Kurangi Coins</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jumlah Coins
              </label>
              <input
                type="number"
                value={editCoinForm.coins}
                onChange={(e) => setEditCoinForm({ ...editCoinForm, coins: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  editCoinForm.coins.length === 0 ? 'border-gray-300 focus:ring-blue-500' :
                  isCoinsValid(editCoinForm.coins) ? 'border-green-300 focus:ring-green-500' : 'border-red-300 focus:ring-red-500'
                }`}
                placeholder="Masukkan jumlah coins..."
                required
                min="1"
              />
              <p className={`text-xs mt-1 ${
                editCoinForm.coins.length === 0 ? 'text-gray-500' :
                isCoinsValid(editCoinForm.coins) ? 'text-green-600' : 'text-red-500'
              }`}>
                {editCoinForm.type === 'add' ? '🟢 Menambahkan' : '🔴 Mengurangi'} coins untuk member ini
                {editCoinForm.coins && isCoinsValid(editCoinForm.coins) && (
                  <span className="ml-2">
                    ({formatNumber(editCoinForm.coins)} coins)
                  </span>
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-red-500">*</span> Alasan (Wajib)
              </label>
              <textarea
                value={editCoinForm.reason}
                onChange={(e) => setEditCoinForm({ ...editCoinForm, reason: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  editCoinForm.reason.length === 0 ? 'border-gray-300 focus:ring-blue-500' :
                  isReasonValid(editCoinForm.reason) ? 'border-green-300 focus:ring-green-500' : 'border-red-300 focus:ring-red-500'
                }`}
                rows="3"
                placeholder="Jelaskan alasan pemberian/pengurangan coins (minimal 5 karakter)..."
                required
                minLength={5}
              />
              <p className={`text-xs mt-1 ${
                editCoinForm.reason.length === 0 ? 'text-red-500' :
                isReasonValid(editCoinForm.reason) ? 'text-green-600' : 'text-red-500'
              }`}>
                <strong>WAJIB:</strong> Alasan harus diisi minimal 5 karakter untuk audit trail
                {editCoinForm.reason.length > 0 && (
                  <span className="ml-2">
                    ({editCoinForm.reason.trim().length}/5 karakter)
                    {isReasonValid(editCoinForm.reason) && " ✓"}
                  </span>
                )}
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={() => setShowEditCoinModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!isCoinsValid(editCoinForm.coins) || !isReasonValid(editCoinForm.reason)}
                className={`flex-1 px-4 py-2 text-white rounded-md transition-colors ${
                  !isCoinsValid(editCoinForm.coins) || !isReasonValid(editCoinForm.reason)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : editCoinForm.type === 'add'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {editCoinForm.type === 'add' ? '➕ Tambah Coins' : '➖ Kurangi Coins'}
              </button>
            </div>
          </form>
        </AdminModal>
      </div>
    </AdminLayout>
  );
}