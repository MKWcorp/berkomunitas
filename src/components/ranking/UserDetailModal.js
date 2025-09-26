'use client';

import { useState, useEffect } from 'react';
import { findUserLevel, getNextLevel, calculateLoyaltyNeeded } from '@/lib/rankingLevels';

const UserDetailModal = ({ user, isOpen, onClose }) => {
  const [userLevel, setUserLevel] = useState(null);

  useEffect(() => {
    if (user) {
      const level = findUserLevel(user.total_loyalty);
      setUserLevel(level);
    }
  }, [user]);

  if (!isOpen || !user || !userLevel) return null;

  const nextLevel = getNextLevel(userLevel);
  const loyaltyNeeded = calculateLoyaltyNeeded(user.total_loyalty, userLevel);
  const memberSince = new Date(user.member_since).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header dengan gradient sesuai level */}
        <div className={`p-6 text-white rounded-t-xl bg-gradient-to-br ${userLevel.gradient}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Large Avatar */}
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                {user.display_name ? user.display_name.charAt(0).toUpperCase() : 
                 user.username ? user.username.charAt(0).toUpperCase() : '?'}
              </div>
              
              <div>
                <h2 className="text-xl font-bold">{user.display_name || user.username}</h2>
                <p className="text-white/80 text-sm">@{user.username}</p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <span className="text-white text-lg font-bold">×</span>
            </button>
          </div>

          {/* Level Badge */}
          <div className="mt-4">
            <div className="inline-flex items-center space-x-2 bg-black/20 px-4 py-2 rounded-full border border-white/30">
              <span className="text-lg">
                {userLevel.category === 'surga' ? '🌟' : 
                 userLevel.category === 'dunia' ? '🌍' : '🔥'}
              </span>
              <span className="font-bold text-white">Rank #{userLevel.rank}</span>
              <span className="text-white/60">•</span>
              <span className="text-sm font-medium text-white">{userLevel.category.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Level Information */}
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-gray-800">{userLevel.name}</h3>
            <p className="text-gray-600 text-lg">{userLevel.nameArabic}</p>
            <p className="text-gray-500 italic">{userLevel.description}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {user.total_loyalty.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Poin Loyalty</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {user.total_comments.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Komentar</div>
            </div>
          </div>

          {/* Progress to Next Level */}
          {nextLevel && loyaltyNeeded > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Progress ke Level Selanjutnya</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Target: {nextLevel.name}</span>
                  <span className="text-red-600 font-semibold">
                    -{loyaltyNeeded.toLocaleString()} loyalty
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full bg-gradient-to-r ${nextLevel.gradient} transition-all duration-500`}
                    style={{ 
                      width: `${Math.max(5, (1 - loyaltyNeeded / (nextLevel.minLoyalty - userLevel.minLoyalty)) * 100)}%` 
                    }}
                  ></div>
                </div>
                
                <p className="text-xs text-gray-500 text-center">
                  Kamu butuh <span className="font-semibold">{loyaltyNeeded.toLocaleString()}</span> loyalty lagi untuk{' '}
                  {nextLevel.category === 'neraka' ? (
                    <>naik ke <span className="font-semibold">Neraka {nextLevel.name}</span></>
                  ) : nextLevel.category === 'dunia' ? (
                    <>naik menjadi <span className="font-semibold">{nextLevel.name}</span></>
                  ) : nextLevel.category === 'surga' ? (
                    <>naik ke <span className="font-semibold">Surga {nextLevel.name}</span></>
                  ) : (
                    <>naik ke level <span className="font-semibold">{nextLevel.name}</span></>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Narasi Islami */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border-l-4 border-indigo-400">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
              <span className="mr-2">🕌</span>
              Narasi Spiritual
            </h4>
            <p className="text-gray-700 italic leading-relaxed">
              "{userLevel.narration}"
            </p>
          </div>

          {/* Member Info */}
          <div className="pt-4 border-t border-gray-200 text-center space-y-2">
            <p className="text-sm text-gray-500">
              <span className="font-medium">Member sejak:</span> {memberSince}
            </p>
            
            {/* Motivational Message */}
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                {userLevel.category === 'surga' ? 
                  '🌟 Masha Allah! Terus pertahankan amal baik Anda!' :
                  userLevel.category === 'dunia' ?
                  '🌍 Semangat! Terus tingkatkan kontribusi positif!' :
                  '🔥 Jangan menyerah! Setiap langkah menuju kebaikan sangat berharga!'
                }
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-lg transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                // Could implement profile navigation here
                onClose();
              }}
              className={`flex-1 bg-gradient-to-r ${userLevel.gradient} hover:opacity-90 text-white font-medium py-3 rounded-lg transition-opacity`}
            >
              Lihat Profil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
