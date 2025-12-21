'use client';
import { 
  UsersIcon, 
  TrophyIcon, 
  CurrencyDollarIcon, 
  GiftIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  ChatBubbleBottomCenterTextIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect, useMemo } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { 
  AdminPageLayout,
  AdminPageHeader,
  AdminStatsGrid,
  AdminContentContainer,
  AdminEmptyState
} from '@/components/AdminComponents';
import { GlassContainer, GlassCard } from '@/components/GlassLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

export default function DashboardPage() {
  const { user, isLoaded } = useSSOUser();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'tanggal', direction: 'desc' });
  
  // Filter states for each chart
  const [memberFilter, setMemberFilter] = useState('harian');
  const [komentarFilter, setKomentarFilter] = useState('harian');
  const [loyaltyFilter, setLoyaltyFilter] = useState('harian');

  // Generate data based on filter and metric type
  const generateChartData = (filter, metric) => {
    if (!data?.statistik_harian) return [];
    
    let chartData = [];
    const rawData = [...data.statistik_harian].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
    
    if (filter === 'harian') {
      // Last 30 days
      chartData = rawData.slice(-30).map(stat => ({
        label: new Date(stat.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        value: getMetricValue(stat, metric),
        fullDate: stat.tanggal
      }));
    } else if (filter === 'mingguan') {
      // Group by weeks
      const weeklyData = {};
      rawData.forEach(stat => {
        const date = new Date(stat.tanggal);
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
        const weekKey = weekStart.toISOString().split('T')[0];
        const weekLabel = `Minggu ${weekStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { label: weekLabel, value: 0, count: 0 };
        }
        weeklyData[weekKey].value += getMetricValue(stat, metric);
        weeklyData[weekKey].count += 1;
      });
      
      chartData = Object.values(weeklyData).slice(-12); // Last 12 weeks
    } else if (filter === 'bulanan') {
      // Group by months
      const monthlyData = {};
      rawData.forEach(stat => {
        const date = new Date(stat.tanggal);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { label: monthLabel, value: 0 };
        }
        monthlyData[monthKey].value += getMetricValue(stat, metric);
      });
      
      chartData = Object.values(monthlyData).slice(-6); // Last 6 months
    }
    
    return chartData;
  };
  
  const getMetricValue = (stat, metric) => {
    switch(metric) {
      case 'member': return stat.total_member_baru || 0;
      case 'komentar': return stat.total_komentar_baru || 0;
      case 'loyalty': return stat.total_poin_diberikan || 0;
      default: return 0;
    }
  };

  const memberChartData = generateChartData(memberFilter, 'member');
  const komentarChartData = generateChartData(komentarFilter, 'komentar');
  const loyaltyChartData = generateChartData(loyaltyFilter, 'loyalty');

  // Filter button component
  const FilterButtons = ({ currentFilter, setFilter, label }) => (
    <div className="flex items-center space-x-2 mb-4">
      <span className="text-sm font-medium text-gray-700">{label}:</span>
      {['harian', 'mingguan', 'bulanan'].map((filter) => (
        <button
          key={filter}
          onClick={() => setFilter(filter)}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            currentFilter === filter
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          {filter.charAt(0).toUpperCase() + filter.slice(1)}
        </button>
      ))}
    </div>
  );

  // Chart component
  const Chart = ({ data, title, color, filter }) => (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <ChartBarIcon className="w-5 h-5 mr-2" style={{ color }} />
        {title}
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              fill={color} 
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );

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
      console.log('Admin check result:', privilegeData);
      if (privilegeData.success && privilegeData.isAdmin) {
        setIsAdmin(true);
        fetchDashboard();
      } else {
        console.log('Admin access denied, redirecting to home');
        router.push('/');
      }
    })
    .catch(error => {
      console.error('Admin check error:', error);
      router.push('/');
    });
  }, [isLoaded, user, router]);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', { 
        headers: { 
          'x-user-email': user.email,
          'Cache-Control': 'no-cache'
        } 
      });
      
      const result = await response.json();
      console.log('Dashboard API response:', result);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        console.log('Setting data:', result);
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

  if (!isLoaded || loading) {
    console.log('Dashboard loading state:', { isLoaded, loading, isAdmin });
    return (
      <AdminLayout>
        <AdminPageLayout>
          <GlassCard className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-gray-700">Memuat data dashboard...</div>
          </GlassCard>
        </AdminPageLayout>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    console.log('Admin access denied:', { isAdmin, isLoaded });
    return (
      <AdminLayout>
        <AdminPageLayout>
          <AdminEmptyState
            title="Akses Ditolak"
            description="Anda tidak memiliki akses ke halaman admin"
            icon={ExclamationTriangleIcon}
          />
        </AdminPageLayout>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <AdminPageLayout>
          <AdminEmptyState
            title="Terjadi Kesalahan"
            description={error}
            icon={ExclamationTriangleIcon}
          />
        </AdminPageLayout>
      </AdminLayout>
    );
  }

  if (!data) {
    console.log('No data available:', { data, error, loading, isAdmin });
    return (
      <AdminLayout>
        <AdminPageLayout>
          <AdminEmptyState
            title="Tidak ada data"
            description="Tidak ada data tersedia"
            icon={ExclamationTriangleIcon}
          />
        </AdminPageLayout>
      </AdminLayout>
    );
  }

  console.log('Rendering dashboard with data:', data);
  
  const statsData = [
    {
      title: 'Total Tugas',
      value: data.total_tugas,
      gradient: 'blue',
      description: 'Jumlah tugas'
    },
    {
      title: 'Total Hadiah',
      value: data.total_hadiah,
      gradient: 'green',
      description: 'Jumlah hadiah'
    },
    {
      title: 'Total Lencana',
      value: data.total_lencana,
      gradient: 'yellow',
      description: 'Jumlah lencana'
    },
    {
      title: 'Total Komentar',
      value: data.total_komentar,
      gradient: 'purple',
      description: 'Jumlah komentar'
    },
    {
      title: 'Total Loyalty',
      value: data.total_loyalty,
      gradient: 'orange',
      description: 'Total loyalty points'
    },
    {
      title: 'Total Coin',
      value: data.total_coin,
      gradient: 'red',
      description: 'Total coin'
    }
  ];

  return (
    <AdminLayout>
      <AdminPageLayout>
        <AdminPageHeader 
          title="Dashboard Admin"
          description="Kelola dan pantau sistem komunitas"
        />
        
        {/* Statistics Cards */}
        <AdminStatsGrid stats={statsData} columns={3} />

        {/* Charts Section */}
        <AdminContentContainer>
          <div className="space-y-6">
            {/* Perkembangan Member */}
          <GlassCard className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <UsersIcon className="w-5 h-5 mr-2 text-blue-600" />
                Perkembangan Member
              </h3>
              <FilterButtons 
                currentFilter={memberFilter} 
                setFilter={setMemberFilter} 
                label="Tampilan"
              />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={memberChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.3}
                    name="Member Baru"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Total Komentar */}
          <GlassCard className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <ChatBubbleBottomCenterTextIcon className="w-5 h-5 mr-2 text-green-600" />
                Total Komentar
              </h3>
              <FilterButtons 
                currentFilter={komentarFilter} 
                setFilter={setKomentarFilter} 
                label="Tampilan"
              />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={komentarChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.3}
                    name="Komentar Baru"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Total Loyalty */}
          <GlassCard className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrophyIcon className="w-5 h-5 mr-2 text-purple-600" />
                Total Loyalty
              </h3>
              <FilterButtons 
                currentFilter={loyaltyFilter} 
                setFilter={setLoyaltyFilter} 
                label="Tampilan"
              />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={loyaltyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8B5CF6" 
                    fill="#8B5CF6" 
                    fillOpacity={0.3}
                    name="Poin Diberikan"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
          </div>
        </AdminContentContainer>

        {/* Statistics Table */}
        <AdminContentContainer>
          <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Statistik 30 Hari Terakhir
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white/10 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Total Komentar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Total Loyalty Poin
                  </th>
                </tr>
              </thead>
              <tbody className="backdrop-blur-sm divide-y divide-gray-300/50">
                {data.chart_data?.map((item, index) => (
                  <tr key={`table-${item.tanggal}-${index}`} className="hover:bg-white/20 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(item.tanggal).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.total_komentar_harian || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.total_loyalty_harian || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
        </AdminContentContainer>
      </AdminPageLayout>
    </AdminLayout>
  );
}
