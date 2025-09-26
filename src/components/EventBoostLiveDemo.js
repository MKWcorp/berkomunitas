// EventBoostLiveDemo.js - Demo komponen yang sync dengan database real-time
import React from 'react';
import { useEventBoostSync } from '../hooks/useEventBoostSync';
import { EventBoostBanner, EventBoostBadge, EventBoostInlineDisplay } from './EventBoostComponents';

// Komponen weekend boost yang sync dengan database
export const WeekendBoostDisplay = () => {
  const {
    isActive,
    isInActivePeriod,
    eventConfig,
    isLoading
  } = useEventBoostSync('WEEKEND_BOOST');

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 h-16 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">Loading weekend boost...</span>
      </div>
    );
  }

  return (
    <EventBoostBanner 
      isActive={isActive && isInActivePeriod}
      title={eventConfig?.title || "Weekend Point Boost"}
      description={eventConfig?.description || "Dapatkan poin ekstra di akhir pekan!"}
      boostPercentage={eventConfig?.boostPercentage || 150}
      endDate={eventConfig?.endDate}
    />
  );
};

// Komponen main event yang sync dengan database  
export const MainEventDisplay = () => {
  const {
    isActive,
    isInActivePeriod,
    eventConfig,
    isLoading
  } = useEventBoostSync('MAIN_EVENT');

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 h-12 w-24 rounded-full flex items-center justify-center">
        <span className="text-xs text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <EventBoostBadge 
      isActive={isActive && isInActivePeriod}
      boostPercentage={eventConfig?.boostPercentage || 200}
      size="large"
    />
  );
};

// Komponen special boost yang sync dengan database
export const SpecialBoostDisplay = () => {
  const {
    isActive,
    isInActivePeriod,
    eventConfig,
    pointValue,
    isLoading
  } = useEventBoostSync('SPECIAL_BOOST');

  if (isLoading) {
    return <span className="text-gray-500">Loading boost...</span>;
  }

  return (
    <EventBoostInlineDisplay 
      isActive={isActive && isInActivePeriod}
      pointValue={pointValue}
      originalValue={10}
    />
  );
};

// Komponen gabungan untuk demo semua event types
export const AllEventsDisplay = () => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Main Event Boost</h3>
        <MainEventDisplay />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Weekend Boost</h3>
        <WeekendBoostDisplay />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Special Boost (Inline)</h3>
        <div className="flex items-center gap-2">
          <span>Komentar berhasil! Poin diterima:</span>
          <SpecialBoostDisplay />
        </div>
      </div>
    </div>
  );
};

export default AllEventsDisplay;
