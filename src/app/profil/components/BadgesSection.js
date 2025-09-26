'use client';
import { TrophyIcon, StarIcon, ChartBarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import GlassCard from '../../components/GlassCard';

export default function BadgesSection({ badges, availableBadges }) {
  const getBadgeProgress = (badge) => {
    const userBadge = badges.find(b => b.badge_id === badge.id);
    return {
      earned: !!userBadge,
      earnedAt: userBadge?.earned_at
    };
  };

  return (
    <GlassCard className="space-y-6">
      {/* Lencana yang Sudah Diperoleh */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrophyIcon className="h-7 w-7 text-yellow-600" />
          Lencana Saya ({badges.length})
        </h2>
        {badges.length === 0 ? (
          <div className="text-center py-8 bg-white/60 rounded-2xl border border-gray-300">
            <p className="text-gray-700">Belum ada lencana yang diperoleh.</p>
            <p className="text-sm text-gray-600 mt-2">
              Berpartisipasilah aktif untuk mendapatkan lencana pertama Anda!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((userBadge) => (
              <div 
                key={userBadge.id} 
                className="bg-gradient-to-br from-green-100/80 to-emerald-100/80 border border-green-400 rounded-2xl p-4 transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-green-800">
                      {userBadge.badge.badge_name}
                    </h3>
                    <p className="text-sm mt-1 text-green-700">
                      {userBadge.badge.description}
                    </p>
                  </div>
                  <CheckCircleIconSolid className="h-8 w-8 text-green-600 ml-3" />
                </div>
                
                <div className="bg-green-200/80 text-green-800 text-xs px-3 py-2 rounded-2xl flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4" />
                  <div>
                    <div className="font-medium mb-1">Diperoleh pada:</div>
                    <div>{new Date(userBadge.earned_at).toLocaleDateString('id-ID')}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Semua Lencana yang Tersedia */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <StarIcon className="h-7 w-7 text-blue-600" />
          Semua Lencana Tersedia ({availableBadges.length})
        </h2>
        <p className="text-gray-700 mb-6">
          Kumpulkan semua lencana dengan berpartisipasi aktif dalam komunitas!
        </p>
        
        {availableBadges.length === 0 ? (
          <div className="text-center py-8 bg-white/60 rounded-2xl border border-gray-300">
            <p className="text-gray-700">Tidak ada data lencana yang tersedia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableBadges.map((badge) => {
              const progress = getBadgeProgress(badge);
              return (
                <div 
                  key={badge.id} 
                  className={`rounded-2xl p-4 border-2 transition-all duration-300 hover:scale-105 ${
                    progress.earned 
                      ? 'bg-gradient-to-br from-green-100/80 to-emerald-100/80 border-green-400' 
                      : 'bg-white/60 border-gray-400 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg ${progress.earned ? 'text-green-800' : 'text-gray-800'}`}>
                        {badge.badge_name}
                      </h3>
                      <p className={`text-sm mt-1 ${progress.earned ? 'text-green-700' : 'text-gray-700'}`}>
                        {badge.description}
                      </p>
                    </div>
                    <div className="ml-3">
                      {progress.earned ? (
                        <CheckCircleIconSolid className="h-8 w-8 text-green-600" />
                      ) : (
                        <XCircleIcon className="h-8 w-8 text-gray-400 opacity-50" />
                      )}
                    </div>
                  </div>

                  {/* Kriteria Badge */}
                  <div className={`text-xs px-3 py-2 rounded-2xl ${
                    progress.earned ? 'bg-green-200/80 text-green-800' : 'bg-blue-100/80 text-blue-800'
                  }`}>
                    <div className="font-medium mb-1 flex items-center gap-1">
                      {progress.earned ? (
                        <>
                          <CheckCircleIcon className="h-4 w-4" />
                          Sudah Diperoleh!
                        </>
                      ) : (
                        <>
                          <StarIcon className="h-4 w-4" />
                          Cara Mendapatkan:
                        </>
                      )}
                    </div>
                    <div>
                      {progress.earned ? (
                        `Diperoleh pada ${new Date(progress.earnedAt).toLocaleDateString('id-ID')}`
                      ) : (
                        `${badge.criteria_type}: ${badge.criteria_value} ${
                          badge.criteria_type === 'comment_count' ? 'komentar' :
                          badge.criteria_type === 'loyalty_points' ? 'poin' :
                          badge.criteria_type === 'task_completion' ? 'tugas selesai' :
                          badge.criteria_type === 'social_media_count' ? 'akun sosial media' :
                          'aktivitas'
                        }`
                      )}
                    </div>
                  </div>

                  {/* Progress Bar untuk Badge yang Belum Diperoleh */}
                  {!progress.earned && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-300 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: '0%' }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Mulai berpartisipasi untuk mendapatkan lencana ini
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-blue-100/80 to-purple-100/80 rounded-2xl p-6 border border-blue-400">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-6 w-6 text-purple-600" />
          Statistik Lencana
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{badges.length}</div>
            <div className="text-sm text-gray-700">Diperoleh</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{availableBadges.length - badges.length}</div>
            <div className="text-sm text-gray-700">Tersisa</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {availableBadges.length > 0 ? Math.round((badges.length / availableBadges.length) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-700">Progres</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{availableBadges.length}</div>
            <div className="text-sm text-gray-700">Total</div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
