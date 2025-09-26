'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { findUserLevel, getNextLevel, calculateLoyaltyNeeded } from '@/lib/rankingLevels';

// Function untuk generate pesan lokasi user berdasarkan level
const getLocationMessage = (user, userLevel) => {
  const nama = user.display_name || user.nama_lengkap || user.username || 'Member';
  
  if (userLevel.category === 'neraka') {
    return `${nama} berada di Neraka ${userLevel.name}`;
  } else if (userLevel.category === 'dunia') {
    return `${nama} sedang berjuang di Bumi menjadi ${userLevel.name}`;
  } else if (userLevel.category === 'surga') {
    return `${nama} berada di Surga ${userLevel.name}`;
  }
  
  // Fallback
  return `${nama} berada di level ${userLevel.name}`;
};

const UserAvatar = ({ user, isCurrentUser, onClick }) => {
  const { user: clerkUser } = useUser();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [userLevel, setUserLevel] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Get user's current level
    const level = findUserLevel(user.total_loyalty);
    setUserLevel(level);

    // Calculate smart position based on loyalty
    const calculatedPosition = calculateSmartPosition(user, level);
    setPosition(calculatedPosition);
  }, [user]);

  const handleClick = () => {
    onClick?.(user);
  };

  // Get profile photo URL - prioritize clerk photo for current user, then database photo
  const getProfilePhotoUrl = () => {
    // If this is the current user and clerk has profile image, use it
    if (isCurrentUser && clerkUser?.imageUrl) {
      return clerkUser.imageUrl;
    }
    // Otherwise use database photo
    return user.foto_profil_url;
  };

  const profilePhotoUrl = getProfilePhotoUrl();
  const nextLevel = userLevel ? getNextLevel(userLevel) : null;
  const loyaltyNeeded = userLevel ? calculateLoyaltyNeeded(user.total_loyalty, userLevel) : 0;

  return (
    <div
      className={`absolute cursor-pointer transition-all duration-300 hover:scale-110 ${
        isCurrentUser ? 'z-20' : 'z-10'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)'
      }}
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      data-user-id={user.id}
      data-clerk-id={user.clerk_id}
      data-username={user.username}
    >
      {/* Avatar Circle */}
      <div className={`relative ${
        isCurrentUser 
          ? 'w-16 h-16 ring-4 ring-blue-400 ring-opacity-75' 
          : 'w-12 h-12 hover:w-14 hover:h-14'
      } transition-all duration-200`}>
        
        {/* Background Circle with Level-based Gradient */}
        <div className={`w-full h-full rounded-full ${
          userLevel ? `bg-gradient-to-br ${userLevel.gradient}` : 'bg-gradient-to-br from-gray-400 to-gray-600'
        } flex items-center justify-center text-white font-bold shadow-lg border-2 ${
          isCurrentUser ? 'border-blue-300' : 'border-white/50'
        } overflow-hidden relative`}>
          
          {/* Profile Photo or Initial */}
          {profilePhotoUrl ? (
            <>
              {/* Profile Photo */}
              <img 
                src={profilePhotoUrl}
                alt={user.display_name || user.nama_lengkap || user.username || 'Member'}
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  // Fallback to initial if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              {/* Fallback Initial (hidden by default) */}
              <span 
                className={`absolute inset-0 ${isCurrentUser ? 'text-lg' : 'text-sm hover:text-base'} font-bold transition-all duration-200 items-center justify-center hidden`}
                style={{ display: 'none' }}
              >
                {user.display_name ? user.display_name.charAt(0).toUpperCase() : 
                 user.nama_lengkap ? user.nama_lengkap.charAt(0).toUpperCase() :
                 user.username ? user.username.charAt(0).toUpperCase() : '?'}
              </span>
            </>
          ) : (
            /* User Initial when no photo */
            <span className={`${isCurrentUser ? 'text-lg' : 'text-sm hover:text-base'} font-bold transition-all duration-200`}>
              {user.display_name ? user.display_name.charAt(0).toUpperCase() : 
               user.nama_lengkap ? user.nama_lengkap.charAt(0).toUpperCase() :
               user.username ? user.username.charAt(0).toUpperCase() : '?'}
            </span>
          )}
        </div>

        {/* Level Category Indicator */}
        {userLevel && (
          <div className="absolute -top-1 -right-1 text-xs">
            {userLevel.category === 'surga' ? '🌟' : 
             userLevel.category === 'dunia' ? '🌍' : '🔥'}
          </div>
        )}

        {/* Crown for top users (Surga levels) */}
        {userLevel && userLevel.category === 'surga' && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-yellow-400 text-lg animate-bounce">
            👑
          </div>
        )}

        {/* Current user pulse effect */}
        {isCurrentUser && (
          <>
            <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping"></div>
            <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse"></div>
          </>
        )}
      </div>

      {/* Username Label */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2">
        <div className={`${
          isCurrentUser ? 'bg-blue-600' : 'bg-black/75'
        } text-white px-4 py-2 rounded-md text-base whitespace-nowrap font-semibold shadow-lg max-w-xs`}>
          <div className="text-center">
            {user.display_name || user.nama_lengkap || user.username || 'Member'} ({user.total_loyalty.toLocaleString()})
          </div>
        </div>
      </div>

      {/* Hover Tooltip */}
      {showTooltip && userLevel && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-white border-2 border-gray-200 rounded-lg shadow-xl p-4 min-w-64 max-w-80">
            {/* Custom Status Message */}
            <div className="text-center mb-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-800">
                {getLocationMessage(user, userLevel)}
              </p>
            </div>

            {/* Level Info */}
            <div className="text-center mb-3">
              <h3 className="font-bold text-gray-800 text-sm">{userLevel.name}</h3>
              <p className="text-xs text-gray-600 mb-1">{userLevel.nameArabic}</p>
              <p className="text-xs text-gray-500 italic">{userLevel.description}</p>
            </div>

            {/* Stats */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Loyalty:</span>
                <span className="font-semibold text-blue-600">
                  {user.total_loyalty.toLocaleString()} poin
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Komentar:</span>
                <span className="font-semibold text-green-600">
                  {user.total_comments.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rank:</span>
                <span className="font-semibold text-purple-600">
                  #{userLevel.rank}
                </span>
              </div>
            </div>

            {/* Next Level Info */}
            {nextLevel && loyaltyNeeded > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-1">
                  <span className="font-semibold">
                    {nextLevel.category === 'neraka' ? 'Naik ke:' :
                     nextLevel.category === 'dunia' ? 'Naik menjadi:' : 
                     nextLevel.category === 'surga' ? 'Naik ke:' : 'Next Level:'}
                  </span>{' '}
                  {nextLevel.category === 'neraka' ? `Neraka ${nextLevel.name}` :
                   nextLevel.category === 'surga' ? `Surga ${nextLevel.name}` :
                   nextLevel.name}
                </p>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.max(5, (1 - loyaltyNeeded / (nextLevel.minLoyalty - userLevel.minLoyalty)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-red-500 font-medium">
                    -{loyaltyNeeded.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 italic">
                  Butuh {loyaltyNeeded.toLocaleString()} loyalty lagi untuk{' '}
                  {nextLevel.category === 'neraka' ? (
                    <>naik ke Neraka {nextLevel.name}</>
                  ) : nextLevel.category === 'dunia' ? (
                    <>naik menjadi {nextLevel.name}</>
                  ) : nextLevel.category === 'surga' ? (
                    <>naik ke Surga {nextLevel.name}</>
                  ) : (
                    <>naik level</>
                  )}
                </p>
              </div>
            )}

            {/* Narration */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-700 italic text-center">
                "{userLevel.narration}"
              </p>
            </div>

            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-200"></div>
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-white"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 🎯 SMART POSITIONING ALGORITHM
const calculateSmartPosition = (user, userLevel) => {
  if (!userLevel) {
    return { x: 100, y: 100 }; // Default position
  }

  // Get level boundaries
  const levelTop = userLevel.position.top;
  const levelHeight = userLevel.position.height;
  const levelBottom = levelTop + levelHeight;
  
  // Safe padding to avoid overlap with level indicators
  const topPadding = 40;
  const bottomPadding = userLevel.id === 'jahannam' ? 80 : 40; // Extra padding for Jahannam
  const sidePadding = userLevel.id === 'jahannam' ? 80 : 60; // Extra side padding for Jahannam

  // Calculate user's progress within their level
  const nextLevel = getNextLevel(userLevel);
  let progressInLevel = 0;

  if (nextLevel) {
    const loyaltyRange = nextLevel.minLoyalty - userLevel.minLoyalty;
    const userProgressLoyalty = user.total_loyalty - userLevel.minLoyalty;
    progressInLevel = Math.min(1, Math.max(0, userProgressLoyalty / loyaltyRange));
  }

  // Y Position: Higher loyalty = higher in level
  const availableHeight = levelHeight - (topPadding + bottomPadding);
  const yPosition = levelBottom - bottomPadding - (progressInLevel * availableHeight);

  // X Position: Use simpler distribution with more spread
  const userId = user.id || user.clerk_id || user.username || 0;
  const seed = typeof userId === 'string' ? 
    userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 
    userId;
  
  // Create 5 columns to distribute users more evenly
  const columns = 5;
  const columnIndex = seed % columns;
  const canvasWidth = 1123;
  const columnWidth = (canvasWidth - (sidePadding * 2)) / columns;
  
  // Base X position for this column
  const baseX = sidePadding + (columnIndex * columnWidth) + (columnWidth / 2);
  
  // Add small random offset within column to avoid perfect alignment
  const offset = ((seed * 7919) % 100 - 50) / 2; // -25 to +25 pixel variation
  const finalX = baseX + offset;

  return {
    x: Math.max(sidePadding, Math.min(canvasWidth - sidePadding, finalX)),
    y: Math.max(levelTop + topPadding, Math.min(levelBottom - bottomPadding, yPosition))
  };
};

export default UserAvatar;
