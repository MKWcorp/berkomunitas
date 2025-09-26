// MultipleEventBoostDisplay.js - Komponen untuk menampilkan multiple events sekaligus
import React from 'react';
import { useMultipleEventBoost } from '../hooks/useMultipleEventBoost';
import GlassCard from '../app/components/GlassCard';

const MultipleEventBoostDisplay = () => {
  const { 
    activeEvents, 
    upcomingEvents, 
    isLoading, 
    hasActiveEvents,
    totalBoostPercentage,
    highestBoostEvent
  } = useMultipleEventBoost();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-24 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Events Display */}
      {hasActiveEvents && (
        <GlassCard variant="default" className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-red-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                🔥 {activeEvents.length} EVENT{activeEvents.length > 1 ? 'S' : ''} AKTIF!
              </h3>
              {highestBoostEvent && (
                <div className="bg-gradient-to-r from-orange-100 to-red-100 text-red-700 px-3 py-1 rounded-lg text-sm font-bold border border-red-200">
                  MAX: {highestBoostEvent.boostPercentage}% BOOST
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              {activeEvents.map((event, index) => (
                <div key={event.setting_name} className="flex items-center justify-between bg-white/50 p-3 rounded-lg">
                  <div className="flex-1">
                    <div className="font-semibold text-red-800">
                      {event.title}
                    </div>
                    <div className="text-sm text-red-600">
                      {event.description}
                    </div>
                    <div className="text-xs text-red-500 mt-1">
                      Berakhir: {new Date(event.end_date).toLocaleString()}
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">
                      +{event.pointValue} Poin
                    </div>
                    <div className="bg-gradient-to-r from-orange-100 to-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200 mt-1">
                      {event.boostPercentage}% BOOST
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {activeEvents.length > 1 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm text-yellow-800">
                  💡 <strong>Multiple Events Aktif:</strong> Setiap tugas dapat memperoleh boost dari event yang berbeda-beda!
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Upcoming Events Preview */}
      {upcomingEvents.length > 0 && (
        <GlassCard variant="default" className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <div className="p-4">
            <h4 className="font-bold text-blue-700 mb-2 flex items-center gap-2">
              ⏰ Event Mendatang ({upcomingEvents.length})
            </h4>
            <div className="space-y-2">
              {upcomingEvents.slice(0, 2).map((event) => (
                <div key={event.setting_name} className="bg-white/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-blue-800 text-sm">
                        {event.title}
                      </div>
                      <div className="text-xs text-blue-600">
                        Mulai: {new Date(event.start_date).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                        {event.boostPercentage}% BOOST
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}
      
      {/* No Events State */}
      {!hasActiveEvents && upcomingEvents.length === 0 && (
        <GlassCard variant="default" className="bg-gray-50 border border-gray-200">
          <div className="p-4 text-center text-gray-600">
            <div className="text-2xl mb-2">🎯</div>
            <div className="font-semibold">Tidak ada event aktif saat ini</div>
            <div className="text-sm">Event boost akan muncul otomatis sesuai jadwal</div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

// Komponen untuk single event dengan auto-detection
const AutoEventBoostBanner = ({ eventType = 'WEEKEND_BOOST' }) => {
  const { getEventByName, isEventActive } = useMultipleEventBoost();
  
  const event = getEventByName(eventType === 'WEEKEND_BOOST' ? 'weekend_point_value' : eventType);
  
  if (!event || !event.isActive) {
    return null;
  }

  return (
    <GlassCard variant="default" className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-red-200">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-full p-2">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V17C3 18.11 3.89 19 5 19H11V21C11 21.55 11.45 22 12 22S13 21.55 13 21V19H19C20.11 19 21 18.11 21 17V9M5 3H14.17L19 7.83V17H5V3ZM7 15H17V13H7V15ZM7 11H17V9H7V11ZM7 7H12V5H7V7Z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-700">
              🔥 {event.title}
            </h3>
            <p className="text-sm text-red-600">
              {event.description} Berakhir: {new Date(event.end_date).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-3 py-2 rounded-lg text-sm font-bold border border-green-200">
            +{event.pointValue} Poin
          </div>
          <div className="bg-gradient-to-r from-orange-100 to-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-bold border border-red-200 mt-1">
            {event.boostPercentage}% BOOST
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export { MultipleEventBoostDisplay, AutoEventBoostBanner };
export default MultipleEventBoostDisplay;
