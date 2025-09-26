'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import GlassCard from '../components/GlassCard';
import { TrophyIcon, ChatBubbleLeftRightIcon, StarIcon } from '@heroicons/react/24/outline';

// Determine text color based on leaderboard rank
const getRankColor = (rank) => {
  switch (rank) {
    case 1:
      return '#f8c600';
    case 2:
      return '#f7da6a';
    case 3:
      return '#efefef';
    default:
      return '#efefef';
  }
};

// Medal component for top 3 positions
const Medal = ({ position }) => {
  const colors = {
    1: 'text-yellow-400',
    2: 'text-gray-400', 
    3: 'text-amber-600'
  };
  
  const icons = {
    1: '🥇',
    2: '🥈',
    3: '🥉'
  };
  
  if (position <= 3) {
    return (
      <div className="flex items-center justify-center w-8 h-8">
        <span className="text-2xl">{icons[position]}</span>
      </div>
    );
  }
  
  return <span className="text-gray-600 font-semibold">#{position}</span>;
};

const DEFAULT_AVATAR = '/placeholder-avatar.png';

// Reusable table row for leaderboard entries with dynamic rank color
const LeaderboardItem = ({ rank, className = '', children }) => (
  <tr className={className} style={{ color: getRankColor(rank) }}>
    {children}
  </tr>
);

// Simple Mobile Table Component (no nested GlassCards)
const MobileRankingTable = ({ data = [], dataKeys, withProfile }) => (
  <div className="bg-white/20 backdrop-blur-sm rounded-xl overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <tbody className="bg-white/10">
          {data.length > 0 ? (
            data.map((item, index) => (
              <LeaderboardItem
                key={index}
                rank={item.peringkat || index + 1}
                className="border-b border-white/20 hover:bg-white/20 transition-colors last:border-b-0"
              >
                {/* Peringkat */}
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                  <div className="flex items-center gap-2">
                    <Medal position={item.peringkat || index + 1} />
                  </div>
                </td>
                {/* Foto + Nama/Username */}
                {withProfile ? (
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Image
                        src={item.foto_profil_url || DEFAULT_AVATAR}
                        alt={item.username || item.username_sosmed || item.nama_lengkap || 'User'}
                        width={28}
                        height={28}
                        className="rounded-full border border-gray-200 bg-white object-cover flex-shrink-0"
                        unoptimized
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/profil/${item.username || item.username_sosmed}`}
                          className="text-blue-700 hover:underline font-medium block truncate text-xs"
                        >
                          {item.nama_lengkap || item.username || item.username_sosmed || 'User'}
                        </Link>
                        {item.username && item.nama_lengkap && (
                          <div className="text-xs text-gray-500 truncate">@{item.username}</div>
                        )}
                      </div>
                    </div>
                  </td>
                ) : null}
                {/* Kolom lain */}
                {dataKeys
                  .filter(
                    key =>
                      key !== 'peringkat' &&
                      key !== 'username' &&
                      key !== 'username_sosmed' &&
                      key !== 'nama_lengkap' &&
                      key !== 'foto_profil_url'
                  )
                  .map(key => (
                    <td key={key} className="px-3 py-2 whitespace-nowrap text-gray-700 text-xs font-semibold">
                      {key === 'loyalty_point' ? (
                        <div className="flex items-center gap-1">
                          <StarIcon className="w-3 h-3 text-yellow-500" />
                          {item[key]?.toLocaleString('id-ID') || '0'}
                        </div>
                      ) : key === 'jumlah_komentar' ? (
                        <div className="flex items-center gap-1">
                          <ChatBubbleLeftRightIcon className="w-3 h-3 text-blue-500" />
                          {item[key]?.toLocaleString('id-ID') || '0'}
                        </div>
                      ) : (
                        item[key] || '-'
                      )}
                    </td>
                  ))}
              </LeaderboardItem>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="px-4 py-8 text-center text-gray-500 text-sm">
                Tidak ada data tersedia
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// Desktop Table Component (with full styling)
const RankingTable = ({ title, headers, data = [], dataKeys, withProfile, icon }) => (
  <GlassCard variant="default" padding="lg" className="w-full" hover>
    <div className="flex items-center gap-3 mb-4">
      {icon}
      <h3 className="font-bold text-xl text-gray-800">{title}</h3>
    </div>
    <GlassCard variant="subtle" padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-blue-500/20 to-purple-500/20">
              {headers.map(header => (
                <th key={header} className="px-2 sm:px-4 py-3 text-left font-semibold text-gray-700 uppercase text-xs sm:text-sm">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white/10">
            {data.length > 0 ? (
              data.map((item, index) => (
                <LeaderboardItem
                  key={index}
                  rank={item.peringkat || index + 1}
                  className="border-b border-white/20 hover:bg-white/20 transition-colors last:border-b-0"
                >
                  {/* Peringkat */}
                  <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-gray-700">
                    <div className="flex items-center gap-2">
                      <Medal position={item.peringkat || index + 1} />
                    </div>
                  </td>
                  {/* Foto + Nama/Username */}
                  {withProfile ? (
                    <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Image
                          src={item.foto_profil_url || DEFAULT_AVATAR}
                          alt={item.username || item.username_sosmed || item.nama_lengkap || 'User'}
                          width={32}
                          height={32}
                          className="rounded-full border border-gray-200 bg-white object-cover flex-shrink-0"
                          unoptimized
                        />
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/profil/${item.username || item.username_sosmed}`}
                            className="text-blue-700 hover:underline font-medium block truncate text-xs sm:text-sm"
                          >
                            {item.nama_lengkap || item.username || item.username_sosmed || 'User'}
                          </Link>
                          {item.username && item.nama_lengkap && (
                            <div className="text-xs text-gray-500 truncate">@{item.username}</div>
                          )}
                        </div>
                      </div>
                    </td>
                  ) : null}
                  {/* Kolom lain */}
                  {dataKeys
                    .filter(
                      key =>
                        key !== 'peringkat' &&
                        key !== 'username' &&
                        key !== 'username_sosmed' &&
                        key !== 'nama_lengkap' &&
                        key !== 'foto_profil_url'
                    )
                    .map(key => (
                      <td
                        key={key}
                        className="px-2 sm:px-4 py-3 whitespace-nowrap text-gray-700 text-xs sm:text-sm font-semibold"
                      >
                        {key === 'loyalty_point' ? (
                          <div className="flex items-center gap-1">
                            <StarIcon className="w-4 h-4 text-yellow-500" />
                            {item[key]?.toLocaleString('id-ID') || '0'}
                          </div>
                        ) : key === 'jumlah_komentar' ? (
                          <div className="flex items-center gap-1">
                            <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-500" />
                            {item[key]?.toLocaleString('id-ID') || '0'}
                          </div>
                        ) : (
                          item[key] || '-'
                        )}
                      </td>
                    ))}
                </LeaderboardItem>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="px-4 py-8 text-center text-gray-500">
                  Tidak ada data tersedia
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  </GlassCard>
);

// Main Leaderboard Page Component
export default function LeaderboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('loyalty'); // Tab state untuk mobile

  // Fungsi fetch data leaderboard
  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch('/api/leaderboard', { cache: 'no-store' });
      if (!response.ok) throw new Error('Gagal memuat data leaderboard.');
      const result = await response.json();
      if (result.success) {
        setDashboardData(result.data);
        setError(null);
      } else {
        throw new Error(result.error || 'Terjadi kesalahan pada server.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch pertama dan polling setiap 30 detik (reduced from 10)
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(false); // fetch tanpa loading spinner
    }, 30000); // 30 detik untuk mengurangi beban database
    return () => clearInterval(interval);
  }, []);

  // Handler manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <GlassCard className="min-h-screen" padding="lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-blue-600">Memuat Dashboard & Statistik...</div>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="min-h-screen" padding="lg">
        <div className="text-center p-10">
          <div className="text-2xl font-bold text-red-600 mb-4">Error</div>
          <div className="text-red-500">{error}</div>
        </div>
      </GlassCard>
    );
  }
  return (
    <div className="min-h-screen">
      {/* Mobile Layout: Simplified */}
      <div className="block lg:hidden">
        <div className="bg-white/10 backdrop-blur-sm p-3">
          {/* Mobile Header: Just Refresh Button and Tabs */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handleRefresh}
              className={`px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-all ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={refreshing}
            >
              {refreshing ? 'Refresh...' : 'Refresh'}
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-white/20 rounded-lg p-1 mb-3">
            <button
              onClick={() => setActiveTab('loyalty')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                activeTab === 'loyalty'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <StarIcon className="w-3 h-3" />
              Top Loyalitas
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                activeTab === 'comments'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <ChatBubbleLeftRightIcon className="w-3 h-3" />
              Top Komentator
            </button>
          </div>

          {/* Mobile Table - Direct display without titles */}
          {activeTab === 'loyalty' && (
            <MobileRankingTable
              data={dashboardData?.loyaltyLeaderboard?.slice(0, 50) || []}
              dataKeys={['peringkat', 'nama_lengkap', 'loyalty_point', 'foto_profil_url', 'username']}
              withProfile
            />
          )}
          {activeTab === 'comments' && (
            <MobileRankingTable
              data={dashboardData?.commentLeaderboard?.slice(0, 50) || []}
              dataKeys={['peringkat', 'username', 'jumlah_komentar', 'foto_profil_url', 'nama_lengkap']}
              withProfile
            />
          )}
        </div>
      </div>

      {/* Desktop Layout: Full Featured */}
      <GlassCard className="hidden lg:block min-h-screen" padding="lg">
        <div className="container mx-auto">
          {/* Desktop Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Leaderboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Peringkat member berdasarkan aktivitas</p>
            </div>
            <button
              onClick={handleRefresh}
              className={`px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={refreshing}
            >
              {refreshing ? 'Menyegarkan...' : 'Refresh'}
            </button>
          </div>

          {/* Desktop Layout: Side by Side */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <RankingTable
              title="Top 50 Poin Loyalitas"
              headers={['Rank', 'User', 'Total Poin']}
              data={dashboardData?.loyaltyLeaderboard?.slice(0, 50) || []}
              dataKeys={['peringkat', 'nama_lengkap', 'loyalty_point', 'foto_profil_url', 'username']}
              withProfile
              icon={<StarIcon className="w-6 h-6 text-yellow-500" />}
            />
            <RankingTable
              title="Top 50 Komentator"
              headers={['Rank', 'User', 'Jumlah Komentar']}
              data={dashboardData?.commentLeaderboard?.slice(0, 50) || []}
              dataKeys={['peringkat', 'username', 'jumlah_komentar', 'foto_profil_url', 'nama_lengkap']}
              withProfile
              icon={<ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-500" />}
            />
          </div>

          {/* User Position Info (Desktop only) */}
          {dashboardData?.currentUserPosition && (
            <GlassCard variant="strong" padding="lg" className="bg-gradient-to-r from-green-500/20 to-emerald-600/20">
              <h3 className="font-bold text-lg mb-3 text-gray-800 flex items-center gap-2">
                <TrophyIcon className="w-5 h-5 text-green-600" />
                Posisi Anda
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Loyalitas</div>
                  <div className="text-xl font-bold text-blue-600">
                    #{dashboardData.currentUserPosition.loyaltyRank}
                  </div>
                  <div className="text-xs text-gray-500">
                    {dashboardData.currentUserPosition.member?.loyalty_point?.toLocaleString('id-ID')} poin
                  </div>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Komentar</div>
                  <div className="text-xl font-bold text-green-600">
                    #{dashboardData.currentUserPosition.commentRank || '-'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Member: {dashboardData.currentUserPosition.member?.nama_lengkap}
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Last Update Info (Desktop only) */}
          {dashboardData?.lastUpdate && (
            <div className="text-center mt-6">
              <p className="text-xs text-gray-500">
                Terakhir diperbarui: {new Date(dashboardData.lastUpdate).toLocaleString('id-ID')}
              </p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
