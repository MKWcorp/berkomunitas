'use client';
import { TrophyIcon, StarIcon } from '@heroicons/react/24/outline';
import GlassCard from '../../components/GlassCard';

export default function BadgesTab({ badges, level }) {
  console.log('🔍 BadgesTab received badges:', badges);
  
  return (
    <div className="space-y-6">
      {/* Level Section */}
      <GlassCard variant="default" padding="lg">
        <div className="flex items-center mb-6">
          <StarIcon className="h-6 w-6 text-amber-500 mr-3" />
          <h2 className="text-xl font-semibold text-gray-800">Level Saya</h2>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">{level.current?.level_number || 1}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{level.current?.level_name || 'Pemula'}</h3>
          <p className="text-gray-600 mb-4">
            {level.current?.required_points || 0} loyalty points
          </p>

          {level.next && (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress ke level berikutnya</span>
                <span>{Math.round(level.progressPercent || 0)}%</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2 mb-2 backdrop-blur-sm">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(level.progressPercent || 0, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {level.pointsToNextLevel || 0} poin lagi untuk mencapai <strong>{level.next.level_name}</strong>
              </p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Badges Section */}
      <GlassCard variant="default" padding="lg">
        <div className="flex items-center mb-6">
          <TrophyIcon className="h-6 w-6 text-purple-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Lencana Saya</h2>
        </div>        {badges && badges.length > 0 ? (
          <div className="flex flex-wrap gap-3 justify-center">
            {badges.map((badge, index) => {
              // Generate Shields.io URL with customization
              const badgeColor = badge.badge_color || 'blue';
              const badgeStyle = badge.badge_style || 'flat';
              const badgeMessage = badge.badge_message || 'Achievement';
              
              const shieldsUrl = `https://img.shields.io/badge/${encodeURIComponent(badge.badge_name)}-${encodeURIComponent(badgeMessage)}-${badgeColor}?style=${badgeStyle}`;
              
              return (
                <div 
                  key={badge.id ? `badge-${badge.id}` : `badge-${index}`}
                  className="relative group"
                  title={`${badge.badge_name}\n${badge.description}\nDiraih: ${badge.earned_date ? new Date(badge.earned_date).toLocaleDateString('id-ID') : 'Tanggal tidak tersedia'}`}
                >
                  {/* Shields.io Badge */}
                  <img
                    src={shieldsUrl}
                    alt={badge.badge_name}
                    className="h-6 transition-all duration-200 hover:scale-110 cursor-pointer"
                  />
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48 text-center">
                    <div className="font-semibold mb-1">{badge.badge_name}</div>
                    <div className="text-gray-300 text-xs mb-1">{badge.description}</div>
                    <div className="text-gray-400 text-xs">
                      {badge.earned_date && (
                        <>Diraih: {new Date(badge.earned_date).toLocaleDateString('id-ID')}</>
                      )}
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <TrophyIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Belum Ada Lencana</h3>
            <p className="text-sm">
              Ikuti berbagai kegiatan komunitas untuk mendapatkan lencana pertama Anda!
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
