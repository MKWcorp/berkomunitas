'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSSOUser } from '@/hooks/useSSOUser';
import Image from 'next/image';
import GlassCard from '../../components/GlassCard';
import { 
  TrophyIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';

export default function PublicProfilePage() {
  const { username } = useParams();
  const { user, isLoaded } = useSSOUser();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wallMessage, setWallMessage] = useState('');
  const [postingMessage, setPostingMessage] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  // Fetch profile data
  useEffect(() => {
    if (username) {
      fetchProfileData();
    }
  }, [username]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/profil/${username}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Profil pengguna tidak ditemukan');
        } else {
          setError('Gagal memuat data profil');
        }
        return;
      }

      const data = await response.json();
      setProfileData(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Gagal memuat data profil');
    } finally {
      setLoading(false);
    }
  };

  const handleWallPost = async (e) => {
    e.preventDefault();
    
    if (!wallMessage.trim()) {
      alert('Pesan tidak boleh kosong');
      return;
    }

    try {
      setPostingMessage(true);
      const response = await fetch('/api/profil/wall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileOwnerId: profileData.id,
          message: wallMessage.trim()
        })
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || 'Gagal mengirim pesan');
        return;
      }

      // Add the new post to the beginning of the wall posts
      setProfileData(prev => ({
        ...prev,
        wallPosts: [result.data, ...prev.wallPosts]
      }));

      setWallMessage('');
      setPostSuccess(true);
      setTimeout(() => setPostSuccess(false), 3000);

    } catch (err) {
      console.error('Error posting message:', err);
      alert('Gagal mengirim pesan');
    } finally {
      setPostingMessage(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex items-center justify-center">
          <GlassCard variant="subtle" padding="lg" className="text-center max-w-md">
            <div className="text-6xl mb-4">
              <UserIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-gray-400" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {error}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">Silakan periksa username dan coba lagi</p>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white/10 backdrop-blur-sm">
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
        
        {/* Page Header - Hidden on mobile */}
        <div className="hidden sm:flex items-center justify-between mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Profil Publik
          </h1>
        </div>
        
        {/* Profile Header - Mobile Optimized */}
        <GlassCard variant="default" padding="default" className="mb-4 sm:mb-6" hover>
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-white/20 border-4 border-blue-200/50 shadow-lg">
                {profileData.foto_profil_url ? (
                  <Image
                    src={profileData.foto_profil_url}
                    alt={profileData.nama_lengkap || 'Profile'}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg sm:text-2xl font-bold text-white bg-gradient-to-br from-blue-400 to-purple-500">
                    {profileData.nama_lengkap?.charAt(0) || '?'}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {profileData.nama_lengkap || 'Nama belum diatur'}
              </h1>
              
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 text-xs sm:text-sm mb-3">
                <span className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-700 px-2 py-1 sm:px-3 sm:py-1 rounded-full font-medium border border-blue-300/30">
                  @{profileData.username}
                </span>
                {profileData.currentLevel && (
                  <span className="bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-700 px-2 py-1 sm:px-3 sm:py-1 rounded-full font-medium border border-green-300/30">
                    {profileData.currentLevel.level_name}
                  </span>
                )}
                <span className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-700 px-2 py-1 sm:px-3 sm:py-1 rounded-full font-medium border border-amber-300/30">
                  {profileData.loyalty_point} Poin
                </span>
              </div>

              {profileData.status_kustom && (
                <p className="text-gray-700 italic mb-3 text-sm sm:text-base">"{profileData.status_kustom}"</p>
              )}

              {profileData.bio && (
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{profileData.bio}</p>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Featured Badge - Mobile Optimized */}
        {profileData.featuredBadge && (
          <GlassCard variant="default" padding="default" className="mb-4 sm:mb-6" hover>
            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 flex items-center gap-2">
              <TrophyIcon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
              Badge Unggulan
            </h2>
            <div className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 border border-amber-200/50 rounded-2xl p-3 sm:p-4">
              <h3 className="font-bold text-base sm:text-lg text-amber-800 mb-2">
                {profileData.featuredBadge.badge_name}
              </h3>
              <p className="text-amber-700 text-sm sm:text-base">{profileData.featuredBadge.description}</p>
            </div>
          </GlassCard>
        )}

        <div className="space-y-4 sm:space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
          
          {/* Badge Gallery - Simplified for Mobile */}
          <GlassCard variant="default" padding="default" hover>
            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4 flex items-center gap-2">
              <TrophyIcon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
              Koleksi Badge ({profileData.badges.length})
            </h2>
            
            {profileData.badges.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {profileData.badges.map((badge) => (
                  <div 
                    key={badge.id}
                    className={`p-3 rounded-xl backdrop-blur-sm border ${
                      badge.is_featured 
                        ? 'border-amber-300/50 bg-amber-50/30' 
                        : 'border-gray-200/30 bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {badge.badge_name}
                          {badge.is_featured && <TrophyIcon className="inline ml-2 h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{badge.description}</p>
                      </div>
                      <div className="text-xs text-gray-500 ml-2 text-right">
                        {formatDate(badge.earned_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">
                Belum ada badge yang diperoleh
              </p>
            )}
          </GlassCard>

          {/* Profile Wall - Simplified for Mobile */}
          <GlassCard variant="default" padding="default" hover>
            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4 flex items-center gap-2">
              <ChatBubbleLeftIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              Dinding Profil
            </h2>

            {/* Post Form - Mobile Optimized */}
            {isLoaded && user && (
              <div className="mb-4 sm:mb-6">
                {postSuccess && (
                  <div className="mb-3 sm:mb-4 p-3 bg-green-100/50 border border-green-300/50 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      <span className="text-green-700 font-medium text-sm sm:text-base">Pesan berhasil dikirim!</span>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleWallPost} className="space-y-3">
                  <textarea
                    value={wallMessage}
                    onChange={(e) => setWallMessage(e.target.value)}
                    placeholder="Tulis pesan untuk profil ini..."
                    rows={3}
                    maxLength={500}
                    className="w-full p-3 border border-white/30 rounded-2xl bg-white/20 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-500 text-sm sm:text-base"
                  />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {wallMessage.length}/500 karakter
                    </span>
                    <button
                      type="submit"
                      disabled={postingMessage || !wallMessage.trim()}
                      className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      {postingMessage ? 'Mengirim...' : 'Kirim Pesan'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Wall Posts - Mobile Optimized */}
            {profileData.wallPosts.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {profileData.wallPosts.map((post) => (
                  <div key={post.id} className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                    <div className="flex items-start space-x-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-white/20 flex-shrink-0 border-2 border-blue-200/50">
                        {post.author.foto_profil_url ? (
                          <Image
                            src={post.author.foto_profil_url}
                            alt={post.author.nama_lengkap}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-blue-400 to-purple-500">
                            {post.author.nama_lengkap?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-1">
                          <span className="font-semibold text-gray-900 text-sm">
                            {post.author.nama_lengkap}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(post.created_at)}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {post.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">
                Belum ada pesan di dinding profil ini
              </p>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
