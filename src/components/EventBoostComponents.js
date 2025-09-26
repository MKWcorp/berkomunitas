// EventBoostComponents.js - Komponen untuk menampilkan event boost
import React from 'react';
import GlassCard from '../app/components/GlassCard';

const EventBoostBanner = ({ 
  isActive = false, 
  boostPercentage = 300, 
  pointValue = 30, 
  title = "EVENT SPESIAL: BOOST POINTS!", 
  description = "Selesaikan tugas sekarang dan dapatkan poin loyalty berlipat!" 
}) => {
  // Jika event tidak aktif, jangan tampilkan apa-apa
  if (!isActive) {
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
              🔥 {title.replace('BOOST POINTS!', `${boostPercentage}% BOOST POINTS!`)}
            </h3>
            <p className="text-sm text-red-600">
              {description} {pointValue && `Setiap tugas memberikan ${pointValue} poin.`}
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

const EventBoostBadge = ({ 
  isActive = false, 
  boostPercentage = 300, 
  size = 'small' // 'small', 'medium', 'large'
}) => {
  // Jika event tidak aktif, jangan tampilkan apa-apa
  if (!isActive) {
    return null;
  }

  const sizeClasses = {
    small: 'text-xs px-2 py-1',
    medium: 'text-xs px-3 py-1',
    large: 'text-sm px-4 py-2'
  };

  return (
    <div className={`bg-gradient-to-r from-orange-100 to-red-100 text-red-700 rounded-lg font-bold border border-red-200 animate-pulse whitespace-nowrap ${sizeClasses[size]}`}>
      🔥 {boostPercentage}% BOOST
    </div>
  );
};

const EventBoostInlineDisplay = ({
  isActive = false,
  boostPercentage = 300,
  pointValue,
  className = ""
}) => {
  // Jika event tidak aktif, jangan tampilkan badge boost
  if (!isActive) {
    return pointValue ? (
      <div className="flex items-center gap-1">
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold border border-green-200 whitespace-nowrap">
          +{pointValue} Poin
        </div>
      </div>
    ) : null;
  }

  return pointValue ? (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold border border-green-200 whitespace-nowrap">
        +{pointValue} Poin
      </div>
      <EventBoostBadge isActive={isActive} boostPercentage={boostPercentage} />
    </div>
  ) : null;
};

const EventBoostRewardDisplay = ({
  isActive = false,
  boostPercentage = 300,
  pointValue,
  showTrophyIcon = true,
  className = ""
}) => {
  // Jika event tidak aktif, tampilkan reward tanpa boost badge
  if (!isActive) {
    return pointValue ? (
      <div className={`flex items-center gap-2 text-yellow-700 ${className}`}>
        {showTrophyIcon && (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 3V1H17V3H19C20.1 3 21 3.9 21 5V8C21 9.1 20.1 10 19 10H17.8L17 11H7L6.2 10H5C3.9 10 3 9.1 3 8V5C3 3.9 3.9 3 5 3H7ZM5 5V8H6.2L7 9H17L17.8 8H19V5H17V7H7V5H5ZM7 12H17V14H16V22H8V14H7V12Z"/>
          </svg>
        )}
        <span className="font-semibold">Reward: {pointValue} Poin</span>
      </div>
    ) : null;
  }

  return pointValue ? (
    <div className={`flex items-center gap-2 text-yellow-700 ${className}`}>
      {showTrophyIcon && (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 3V1H17V3H19C20.1 3 21 3.9 21 5V8C21 9.1 20.1 10 19 10H17.8L17 11H7L6.2 10H5C3.9 10 3 9.1 3 8V5C3 3.9 3.9 3 5 3H7ZM5 5V8H6.2L7 9H17L17.8 8H19V5H17V7H7V5H5ZM7 12H17V14H16V22H8V14H7V12Z"/>
        </svg>
      )}
      <span className="font-semibold">Reward: {pointValue} Poin</span>
      <EventBoostBadge isActive={isActive} boostPercentage={boostPercentage} size="medium" />
    </div>
  ) : null;
};

const EventBoostCompletionDisplay = ({
  isActive = false,
  boostPercentage = 300,
  pointValue,
  className = ""
}) => {
  // Jika event tidak aktif, tampilkan tanpa boost badge
  if (!isActive) {
    return pointValue ? (
      <div className={`flex items-center justify-center gap-1 text-xs sm:text-sm ${className}`}>
        <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 3V1H17V3H19C20.1 3 21 3.9 21 5V8C21 9.1 20.1 10 19 10H17.8L17 11H7L6.2 10H5C3.9 10 3 9.1 3 8V5C3 3.9 3.9 3 5 3H7ZM5 5V8H6.2L7 9H17L17.8 8H19V5H17V7H7V5H5ZM7 12H17V14H16V22H8V14H7V12Z"/>
        </svg>
        <span className="font-semibold text-green-700">+{pointValue} Poin Diperoleh</span>
      </div>
    ) : null;
  }

  return pointValue ? (
    <div className={`flex items-center justify-center gap-1 text-xs sm:text-sm ${className}`}>
      <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M7 3V1H17V3H19C20.1 3 21 3.9 21 5V8C21 9.1 20.1 10 19 10H17.8L17 11H7L6.2 10H5C3.9 10 3 9.1 3 8V5C3 3.9 3.9 3 5 3H7ZM5 5V8H6.2L7 9H17L17.8 8H19V5H17V7H7V5H5ZM7 12H17V14H16V22H8V14H7V12Z"/>
      </svg>
      <span className="font-semibold text-green-700">+{pointValue} Poin Diperoleh</span>
      <div className="ml-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
        🔥 {boostPercentage}% BOOST
      </div>
    </div>
  ) : null;
};

const EventBoostTableDisplay = ({
  isActive = false,
  boostPercentage = 300,
  pointValue,
  className = ""
}) => {
  // Jika event tidak aktif, tampilkan hanya poin tanpa boost
  if (!isActive) {
    return pointValue ? (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ${className}`}>
        🎯 {pointValue} Poin
      </span>
    ) : null;
  }

  return pointValue ? (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        🎯 {pointValue} Poin
      </span>
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-orange-100 to-red-100 text-red-700 border border-red-200 animate-pulse">
        🔥 {boostPercentage}% BOOST
      </span>
    </div>
  ) : null;
};

export default EventBoostBanner;
export { 
  EventBoostBadge, 
  EventBoostInlineDisplay, 
  EventBoostRewardDisplay, 
  EventBoostCompletionDisplay,
  EventBoostTableDisplay
};
