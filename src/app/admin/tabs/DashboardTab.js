import { 
  UsersIcon, 
  TrophyIcon, 
  CurrencyDollarIcon, 
  GiftIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import GlassCard from '../../components/GlassCard';

export default function DashboardTab() {
  const { user, isLoaded } = useSSOUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'tanggal', direction: 'desc' });

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!isLoaded || !user?.email) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/admin/dashboard', { 
          headers: { 
            'x-user-email': user.email,
            'Cache-Control': 'no-cache'
          } 
        });
        
        const result = await response.json();
        
        if (response.ok) {
          setData(result);
        } else {
          setError(result.error || 'Gagal memuat data dashboard');
        }
      } catch (err) {
        setError('Terjadi kesalahan saat memuat data dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [isLoaded, user]);

  if (loading) {
    return (
      <GlassCard className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <div className="text-gray-700">Memuat data dashboard...</div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="text-center py-8">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <div className="text-red-700">{error}</div>
      </GlassCard>
    );
  }

  if (!data) {
    return (
      <GlassCard className="text-center py-8">
        <ExclamationTriangleIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <div className="text-gray-600">Tidak ada data tersedia.</div>
      </GlassCard>
    );
  }

  // Ambil statistik global
  const stats = {};
  if (Array.isArray(data.statistik_global)) {
    for (const s of data.statistik_global) {
      if (s.nama_statistik && s.nilai_statistik !== undefined) {
        stats[s.nama_statistik] = s.nilai_statistik;
      }
    }
  }

  // Sorting logic
  let sortedStatistikHarian = Array.isArray(data.statistik_harian) ? [...data.statistik_harian] : [];
  if (sortConfig.key) {
    sortedStatistikHarian.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      // Untuk tanggal, pastikan string ISO
      if (sortConfig.key === 'tanggal') {
        aVal = typeof aVal === 'string' ? aVal : '';
        bVal = typeof bVal === 'string' ? bVal : '';
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Sort handler
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Dashboard Admin</h2>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <GlassCard className="text-center">
          <UsersIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-gray-600">Total Member</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.total_seluruh_member || 0}</p>
        </GlassCard>
        <GlassCard className="text-center">
          <TrophyIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-gray-600">Total Tugas</h3>
          <p className="text-2xl font-bold text-green-600">{data.total_tugas || 0}</p>
        </GlassCard>
        <GlassCard className="text-center">
          <GiftIcon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-gray-600">Total Hadiah</h3>
          <p className="text-2xl font-bold text-purple-600">{data.total_hadiah || 0}</p>
        </GlassCard>
        <GlassCard className="text-center">
          <TrophyIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-gray-600">Total Lencana</h3>
          <p className="text-2xl font-bold text-yellow-600">{data.total_lencana || 0}</p>
        </GlassCard>
        <GlassCard className="text-center">
          <ChatBubbleBottomCenterTextIcon className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-gray-600">Total Komentar</h3>
          <p className="text-2xl font-bold text-pink-600">{stats.total_seluruh_komentar || 0}</p>
        </GlassCard>
      </div>
      {/* Statistik Harian */}
      <GlassCard>
        <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
          <ChartBarIcon className="h-6 w-6 text-blue-500 mr-2" />
          Statistik Harian (30 hari terakhir)
        </h3>
        {sortedStatistikHarian.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left cursor-pointer select-none" onClick={() => handleSort('tanggal')}>
                    Tanggal {sortConfig.key === 'tanggal' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-4 py-2 text-left cursor-pointer select-none" onClick={() => handleSort('total_komentar_baru')}>
                    Komentar {sortConfig.key === 'total_komentar_baru' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-4 py-2 text-left cursor-pointer select-none" onClick={() => handleSort('total_tugas_selesai')}>
                    Tugas Selesai {sortConfig.key === 'total_tugas_selesai' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-4 py-2 text-left cursor-pointer select-none" onClick={() => handleSort('total_member_baru')}>
                    Member Baru {sortConfig.key === 'total_member_baru' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-4 py-2 text-left cursor-pointer select-none" onClick={() => handleSort('total_poin_diberikan')}>
                    Total Poin Diberikan {sortConfig.key === 'total_poin_diberikan' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedStatistikHarian.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{
                      typeof row.tanggal === 'string' && row.tanggal.length >= 10
                        ? row.tanggal.slice(0, 10)
                        : '-'
                    }</td>
                    <td className="px-4 py-2">{row.total_komentar_baru || 0}</td>
                    <td className="px-4 py-2">{row.total_tugas_selesai || 0}</td>
                    <td className="px-4 py-2">{row.total_member_baru || 0}</td>
                    <td className="px-4 py-2">{row.total_poin_diberikan || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">Tidak ada data statistik harian.</p>
        )}
      </GlassCard>
    </div>
  );
}
