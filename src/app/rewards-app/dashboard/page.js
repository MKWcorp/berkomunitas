'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  GiftIcon, 
  UsersIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  TruckIcon,
  HandThumbUpIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../components/GlassCard';

export default function RewardsDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState({
    totalRewards: 0,
    totalRedemptions: 0,
    pendingVerifications: 0,
    completedRedemptions: 0,
    shippedRedemptions: 0,
    deliveredRedemptions: 0,
    rejectedRedemptions: 0,
    totalPointsSpent: 0,
    rewardCategories: {
      low: 0,
      medium: 0,
      high: 0,
      premium: 0
    },
    monthlyTrend: [],
    topRewards: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, [user]);

  const loadDashboardStats = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    
    try {
      setLoading(true);
      
      // Load rewards
      const rewardsResponse = await fetch('/api/admin/rewards', {
        headers: { 'x-user-email': user.primaryEmailAddress.emailAddress }
      });
      
      // Load redemptions  
      const redemptionsResponse = await fetch('/api/admin/redemptions');
      
      if (rewardsResponse.ok && redemptionsResponse.ok) {
        const rewardsData = await rewardsResponse.json();
        const redemptionsData = await redemptionsResponse.json();
        
        const rewards = rewardsData.rewards || [];
        const redemptions = redemptionsData.data || [];
        
        const pending = redemptions.filter(r => r.status === 'menunggu_verifikasi').length;
        const completed = redemptions.filter(r => r.status === 'selesai').length;
        const shipped = redemptions.filter(r => r.status === 'dikirim').length;
        const delivered = redemptions.filter(r => r.status === 'diterima').length;
        const rejected = redemptions.filter(r => r.status === 'ditolak').length;
        const totalPoints = redemptions.reduce((sum, r) => sum + (r.points_spent || 0), 0);
        
        // Kategorisasi hadiah berdasarkan cost poin
        const categories = {
          low: rewards.filter(r => (r.point_cost || 0) <= 100).length,      // 0-100 poin
          medium: rewards.filter(r => (r.point_cost || 0) > 100 && (r.point_cost || 0) <= 500).length,  // 101-500 poin
          high: rewards.filter(r => (r.point_cost || 0) > 500 && (r.point_cost || 0) <= 1000).length,   // 501-1000 poin
          premium: rewards.filter(r => (r.point_cost || 0) > 1000).length   // 1000+ poin
        };
        
        setStats({
          totalRewards: rewards.length,
          totalRedemptions: redemptions.length,
          pendingVerifications: pending,
          completedRedemptions: completed,
          shippedRedemptions: shipped,
          deliveredRedemptions: delivered,
          rejectedRedemptions: rejected,
          totalPointsSpent: totalPoints,
          rewardCategories: categories,
          // Mock data untuk trends dan activity - bisa diganti dengan data real
          monthlyTrend: [
            { month: 'Jan', redemptions: 15, points: 1250 },
            { month: 'Feb', redemptions: 23, points: 1890 },
            { month: 'Mar', redemptions: 31, points: 2340 },
            { month: 'Apr', redemptions: 28, points: 2100 },
            { month: 'Mei', redemptions: 35, points: 2750 },
            { month: 'Jun', redemptions: 42, points: 3200 }
          ],
          topRewards: rewards
            .map(reward => {
              const rewardRedemptions = redemptions.filter(r => r.reward_id === reward.id && r.status === 'selesai');
              return {
                name: reward.reward_name,
                redeemed: rewardRedemptions.length,
                totalPoints: rewardRedemptions.reduce((sum, r) => sum + parseInt(r.points_spent || 0), 0)
              };
            })
            .sort((a, b) => b.redeemed - a.redeemed)
            .slice(0, 3),
          recentActivity: redemptions
            .slice(0, 5)
            .map(r => ({
              action: r.status === 'menunggu_verifikasi' ? 'Menunggu verifikasi' :
                      r.status === 'selesai' ? 'Penukaran diverifikasi' : 
                      'Penukaran ditolak',
              reward: rewards.find(reward => reward.id === r.reward_id)?.reward_name || 'Unknown',
              user: r.username || r.display_name || 'Unknown User',
              time: new Date(r.created_at || Date.now()).toLocaleDateString('id-ID')
            }))
        });
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-4 rounded-xl">
              <span className="text-3xl">🎁</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Rewards Dashboard</h1>
              <p className="text-green-100 text-lg">Selamat datang di sistem manajemen hadiah</p>
            </div>
          </div>
        </div>
        
        <GlassCard className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <div className="text-gray-700 text-lg">Memuat dashboard...</div>
        </GlassCard>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Hadiah',
      value: stats.totalRewards,
      icon: GiftIcon,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      name: 'Total Penukaran',
      value: stats.totalRedemptions,
      icon: UsersIcon,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      name: 'Menunggu Verifikasi',
      value: stats.pendingVerifications,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      name: 'Penukaran Selesai',
      value: stats.completedRedemptions,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      name: 'Dikirim',
      value: stats.shippedRedemptions,
      icon: TruckIcon,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      name: 'Diterima',
      value: stats.deliveredRedemptions,
      icon: HandThumbUpIcon,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      name: 'Penukaran Ditolak',
      value: stats.rejectedRedemptions,
      icon: XCircleIcon,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
    {
      name: 'Total Poin Terpakai',
      value: stats.totalPointsSpent?.toLocaleString('id-ID') || '0',
      icon: ChartBarIcon,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-4 rounded-xl">
              <span className="text-3xl">🎁</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Rewards Dashboard</h1>
              <p className="text-green-100 text-lg">Selamat datang, {user?.firstName || 'Admin'}!</p>
              <p className="text-green-200 text-sm mt-1">Panel manajemen sistem hadiah berkomunitas.com</p>
            </div>
          </div>
          
          <div className="hidden md:block text-right">
            <div className="text-white/80 text-sm">
              {new Date().toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-white/60 text-xs">
              rewards.berkomunitas.com
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={stat.name} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-xl`}>
                  <Icon className={`w-8 h-8 ${stat.textColor}`} />
                </div>
              </div>
              
              {/* Progress indicator for some stats */}
              {stat.name === 'Menunggu Verifikasi' && stats.pendingVerifications > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-700 font-medium">
                    ⚠️ Ada {stats.pendingVerifications} penukaran yang perlu diverifikasi
                  </p>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>

      {/* Reward Categories */}
      <GlassCard className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-purple-100 p-2 rounded-lg">
            <TagIcon className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Kategori Hadiah Berdasarkan Jumlah</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-green-800">Ekonomis</h4>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                0-100 poin
              </span>
            </div>
            <div className="text-2xl font-bold text-green-700 mb-1">
              {stats.rewardCategories.low}
            </div>
            <div className="text-sm text-green-600">hadiah tersedia</div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-800">Menengah</h4>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                101-500 poin
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-700 mb-1">
              {stats.rewardCategories.medium}
            </div>
            <div className="text-sm text-blue-600">hadiah tersedia</div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-orange-800">Tinggi</h4>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                501-1000 poin
              </span>
            </div>
            <div className="text-2xl font-bold text-orange-700 mb-1">
              {stats.rewardCategories.high}
            </div>
            <div className="text-sm text-orange-600">hadiah tersedia</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-purple-800">Premium</h4>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                1000+ poin
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-700 mb-1">
              {stats.rewardCategories.premium}
            </div>
            <div className="text-sm text-purple-600">hadiah tersedia</div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Total Hadiah Aktif:</span>
            <span className="font-bold text-gray-900">
              {stats.rewardCategories.low + stats.rewardCategories.medium + 
               stats.rewardCategories.high + stats.rewardCategories.premium} hadiah
            </span>
          </div>
        </div>
      </GlassCard>

    </div>
  );
}