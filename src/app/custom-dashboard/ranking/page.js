'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSSOUser } from '@/hooks/useSSOUser';
import RankingCanvas from '@/components/ranking/RankingCanvas';
import UserDetailModal from '@/components/ranking/UserDetailModal';
import { RANKING_LEVELS, findUserLevel, getNextLevel, calculateLoyaltyNeeded } from '@/lib/rankingLevels';

export default function RankingPage() {
  const router = useRouter();
  const { user, isLoaded } = useSSOUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Redirect to drwcorp by default
  useEffect(() => {
    router.replace('/custom-dashboard/drwcorp');
  }, [router]);

  // Custom ultra slow scroll function - CONTAINER SCROLL VERSION
  const ultraSlowScrollToElement = (element, duration = 5000) => {
    console.log('🐌 Starting ENHANCED ultra slow CONTAINER scroll to avatar element:', element, 'duration:', duration + 'ms');
    
    // Find the main scrollable container (fixed inset-0 dengan overflow-auto)
    const scrollContainer = document.querySelector('.fixed.inset-0.bg-black.overflow-auto') || 
                          document.querySelector('[class*="fixed"][class*="inset-0"][class*="overflow-auto"]') ||
                          document.querySelector('.overflow-auto');
                          
    if (!scrollContainer) {
      console.error('❌ Scroll container not found! Trying document selectors...');
      const allContainers = document.querySelectorAll('[class*="overflow-auto"], [class*="overflow-scroll"]');
      console.log('Available containers:', allContainers);
      if (allContainers.length > 0) {
        scrollContainer = allContainers[0];
        console.log('Using first available container:', scrollContainer);
      } else {
        console.error('No scroll containers found, aborting');
        return;
      }
    }
    
    console.log('📦 Found scroll container:', scrollContainer);
    
    // Debug container scroll properties SEBELUM scroll
    console.log('🔍 Pre-scroll CONTAINER debug:', {
      container: {
        scrollTop: scrollContainer.scrollTop,
        scrollHeight: scrollContainer.scrollHeight,
        clientHeight: scrollContainer.clientHeight,
        canScroll: scrollContainer.scrollHeight > scrollContainer.clientHeight
      },
      element: {
        rect: element.getBoundingClientRect(),
        offsetTop: element.offsetTop,
        style: element.style.cssText
      }
    });

    const rect = element.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    const startScrollTop = scrollContainer.scrollTop;
    
    // Calculate target scroll position relative to container
    const targetScrollTop = startScrollTop + rect.top - containerRect.top - (scrollContainer.clientHeight / 2);
    const distance = targetScrollTop - startScrollTop;

    console.log('📍 ENHANCED CONTAINER scroll details:', {
      avatarPosition: {
        elementTop: Math.round(rect.top),
        containerTop: Math.round(containerRect.top),
        relativeTop: Math.round(rect.top - containerRect.top)
      },
      containerScroll: {
        currentScrollTop: startScrollTop,
        targetScrollTop: Math.round(targetScrollTop),
        distance: Math.round(distance),
        containerHeight: scrollContainer.clientHeight,
        containerScrollHeight: scrollContainer.scrollHeight
      }
    });

    if (Math.abs(distance) < 10) {
      console.log('Avatar already visible in container, no scroll needed');
      return;
    }

    const startTime = performance.now();

    // Easing function for ultra smooth animation
    const easeInOutCubic = (t) => {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    };

    const animateContainerScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);
      
      const currentScrollTop = startScrollTop + (distance * easedProgress);
      
      // CONTAINER scroll method - langsung set scrollTop container
      scrollContainer.scrollTop = currentScrollTop;
      
      // Check actual scroll position
      const actualScrollTop = scrollContainer.scrollTop;
      
      if (elapsed % 1500 < 16) { // Log setiap 1.5 detik untuk detail
        console.log(`🎯 ENHANCED CONTAINER scrolling: ${(progress * 100).toFixed(1)}%`, {
          intendedScrollTop: Math.round(currentScrollTop),
          actualScrollTop: Math.round(actualScrollTop),
          scrollIsWorking: Math.abs(actualScrollTop - currentScrollTop) < 100,
          remaining: Math.round(distance * (1 - progress)) + 'px'
        });
      }
      
      if (progress < 1) {
        requestAnimationFrame(animateContainerScroll);
      } else {
        console.log('✅ ENHANCED Ultra slow CONTAINER scroll completed!');
        
        // Final comprehensive check
        const finalScrollTop = scrollContainer.scrollTop;
        const finalRect = element.getBoundingClientRect();
        console.log('📊 Final ENHANCED position check:', {
          finalScrollTop: Math.round(finalScrollTop),
          targetScrollTop: Math.round(targetScrollTop),
          scrollDifference: Math.round(Math.abs(finalScrollTop - targetScrollTop)),
          finalElementTop: Math.round(finalRect.top),
          containerHeight: scrollContainer.clientHeight,
          isInViewport: finalRect.top >= containerRect.top && finalRect.bottom <= containerRect.bottom,
          scrollSuccessful: Math.abs(finalScrollTop - targetScrollTop) < 200
        });
      }
    };

    requestAnimationFrame(animateContainerScroll);
  };

  // Simple Auto Scroll - langsung ke element user avatar
  useEffect(() => {
    // Tunggu data user dan users sudah ready
    if (!isLoaded || !user?.id || !users.length) return;
    
    // Find current user
    const currentUser = users.find(u => 
      u.clerk_id === user.id || 
      u.id === user.id || 
      u.username === user.username
    );
    
    if (!currentUser) {
      console.log('User tidak ditemukan dalam ranking');
      return;
    }

    console.log('Looking for user element:', currentUser);

    // Function to find and scroll to user element
    const scrollToUserElement = () => {
      console.log('=== Searching for user element ===');
      console.log('Current user data:', {
        id: currentUser.id,
        google_id: currentUser.clerk_id,
        username: currentUser.username
      });
      
      // Try different selectors to find user avatar element
      let userElement = null;
      
      // Try to find by user ID
      console.log('Searching for:', `[data-user-id="${currentUser.id}"]`);
      userElement = document.querySelector(`[data-user-id="${currentUser.id}"]`);
      console.log('Found by ID:', userElement);
      
      if (!userElement) {
        console.log('Searching for:', `[data-user-id="${currentUser.clerk_id}"]`);
        userElement = document.querySelector(`[data-user-id="${currentUser.clerk_id}"]`);
        console.log('Found by google_id:', userElement);
      }
      
      if (!userElement) {
        console.log('Searching for:', `[data-user-id="${currentUser.username}"]`);
        userElement = document.querySelector(`[data-user-id="${currentUser.username}"]`);
        console.log('Found by username:', userElement);
      }
      
      // Debug: show all available elements
      const allAvatars = document.querySelectorAll('[data-user-id]');
      console.log('All available user elements:', Array.from(allAvatars).map(el => ({
        userId: el.getAttribute('data-user-id'),
        clerkId: el.getAttribute('data-clerk-id'),
        username: el.getAttribute('data-username'),
        element: el
      })));
      
      if (userElement) {
        console.log('✅ Found user element, scrolling to it:', userElement);
        
        // Use custom ultra slow scroll (5 seconds)
        ultraSlowScrollToElement(userElement, 5000);
        
        return true;
      } else {
        console.log('❌ User element not found, will retry...');
        return false;
      }
    };

    // Try to scroll immediately first
    if (scrollToUserElement()) {
      return;
    }

    // If not found, retry with increasing delays
    const retryIntervals = [500, 1000, 2000, 3000];
    const timers = [];
    
    retryIntervals.forEach((delay, index) => {
      const timer = setTimeout(() => {
        if (scrollToUserElement()) {
          // Clear remaining timers if successful
          timers.slice(index + 1).forEach(clearTimeout);
        }
      }, delay);
      timers.push(timer);
    });
    
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isLoaded, user?.id, users, user?.username]);

  // Manual scroll function untuk tombol - TEST SIMPLE FIRST
  const scrollToCurrentUser = () => {
    console.log('=== Manual scroll triggered ===');
    if (!user?.id || !users.length) {
      console.log('No user or users data');
      return;
    }
    
    const currentUser = users.find(u => 
      u.clerk_id === user.id || 
      u.id === user.id || 
      u.username === user.username
    );
    
    if (!currentUser) {
      console.log('Current user not found in users list');
      return;
    }

    console.log('Manual scroll - Current user:', currentUser);
    
    // Try to find user element
    let userElement = null;
    
    userElement = document.querySelector(`[data-user-id="${currentUser.id}"]`);
    if (!userElement) {
      userElement = document.querySelector(`[data-user-id="${currentUser.clerk_id}"]`);
    }
    if (!userElement) {
      userElement = document.querySelector(`[data-user-id="${currentUser.username}"]`);
    }
    
    if (userElement) {
      console.log('✅ Manual scroll - Found user element:', userElement);
      
      // Find scroll container first
      const scrollContainer = document.querySelector('.fixed.inset-0.bg-black.overflow-auto') || 
                            document.querySelector('[class*="overflow-auto"]');
      
      if (scrollContainer) {
        console.log('📦 Manual scroll - Using container scroll:', scrollContainer);
        
        // TEST: Try simple immediate CONTAINER scroll first
        const rect = userElement.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        const targetY = scrollContainer.scrollTop + rect.top - containerRect.top - (scrollContainer.clientHeight / 2);
        
        console.log('🧪 TESTING simple immediate CONTAINER scroll to:', targetY);
        
        // Direct container scroll
        scrollContainer.scrollTop = targetY;
        
        // Check if simple scroll worked after 200ms
        setTimeout(() => {
          const actualScroll = scrollContainer.scrollTop;
          console.log('📊 Simple CONTAINER scroll test result:', {
            intended: targetY,
            actual: actualScroll,
            difference: Math.abs(actualScroll - targetY),
            success: Math.abs(actualScroll - targetY) < 100
          });
          
          // If simple scroll didn't work, try animated
          if (Math.abs(actualScroll - targetY) > 100) {
            console.log('⚡ Simple container scroll failed, trying animated scroll...');
            ultraSlowScrollToElement(userElement, 5000);
          } else {
            console.log('🎉 Simple container scroll worked! No animation needed.');
          }
        }, 200);
      } else {
        console.log('⚠️ No scroll container found, falling back to document scroll');
        
        // Fallback to document scroll (original code)
        const rect = userElement.getBoundingClientRect();
        const targetY = rect.top + window.pageYOffset - (window.innerHeight / 2);
        
        console.log('🧪 TESTING simple immediate document scroll to:', targetY);
        
        window.scrollTo(0, targetY);
        document.documentElement.scrollTop = targetY;
        document.body.scrollTop = targetY;
        
        setTimeout(() => {
          const actualScroll = window.pageYOffset;
          console.log('📊 Simple document scroll test result:', {
            intended: targetY,
            actual: actualScroll,
            difference: Math.abs(actualScroll - targetY),
            success: Math.abs(actualScroll - targetY) < 100
          });
          
          if (Math.abs(actualScroll - targetY) > 100) {
            console.log('⚡ Simple document scroll failed, trying animated scroll...');
            ultraSlowScrollToElement(userElement, 5000);
          }
        }, 200);
      }
      
    } else {
      console.log('❌ Manual scroll - User element not found, trying level fallback');
      // Fallback to level-based page scroll
      const userLevel = findUserLevel(currentUser.total_loyalty);
      if (userLevel) {
        console.log('Manual fallback - immediate scroll to level position:', userLevel.position);
        
        const targetY = userLevel.position.top + (userLevel.position.height / 2) - (window.innerHeight / 2);
        console.log('🧪 TESTING simple level scroll to:', targetY);
        
        window.scrollTo(0, targetY);
        
        setTimeout(() => {
          const actualScroll = window.pageYOffset;
          console.log('📊 Level scroll test result:', {
            intended: targetY,
            actual: actualScroll,
            success: Math.abs(actualScroll - targetY) < 100
          });
        }, 200);
      }
    }
  };

  // Memoize user stats for performance
  const userStats = useMemo(() => {
    if (!users.length) return { surga: 0, dunia: 0, neraka: 0 };
    
    return {
      surga: users.filter(u => u.total_loyalty >= 50000).length,
      dunia: users.filter(u => u.total_loyalty >= 10000 && u.total_loyalty < 50000).length,
      neraka: users.filter(u => u.total_loyalty < 10000).length
    };
  }, [users]);

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ranking/leaderboard');
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
        setLastUpdate(new Date(data.timestamp));
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to fetch leaderboard');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Real-time updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle user click
  const handleUserClick = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  // Loading state
  if (!isLoaded || (loading && users.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">Memuat Ranking...</h2>
            <p className="text-gray-600">Mengambil data loyalty dari semua member...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Gagal Memuat Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-auto">
      {/* Unified Header - Stats, User Status, and Auto Scroll */}
      <div className="sticky top-16 z-30 bg-black/30 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="w-full px-2 sm:px-4 py-3">
          {/* Three-column layout: Stats | User Status | Button */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            {/* Left: Stats */}
            <div className="text-xs text-gray-300 text-center sm:text-left">
              <span className="inline-block">{users.length} member</span>
              <span className="mx-1">•</span>
              <span className="text-yellow-400">{userStats.surga} Surga</span>
              <span className="mx-1">•</span>
              <span className="text-green-400">{userStats.dunia} Dunia</span>
              <span className="mx-1">•</span>
              <span className="text-red-400">{userStats.neraka} Neraka</span>
            </div>
            
            {/* Center: User Status */}
            {user && users.length > 0 && (() => {
              const currentUser = users.find(u => 
                u.clerk_id === user.id || 
                u.id === user.id || 
                u.username === user.username
              );
              
              if (currentUser) {
                const userLevel = findUserLevel(currentUser.total_loyalty);
                const nextLevel = userLevel ? getNextLevel(userLevel) : null;
                const loyaltyNeeded = userLevel ? calculateLoyaltyNeeded(currentUser.total_loyalty, userLevel) : 0;
                
                return (
                  <div className="text-center flex-shrink-0">
                    <div className="inline-block bg-gradient-to-r from-blue-50/90 to-indigo-50/90 rounded-full px-2 py-1 text-xs">
                      <span className="text-gray-700">Anda di </span>
                      <span className={`font-bold ${
                        userLevel?.category === 'surga' ? 'text-yellow-600' :
                        userLevel?.category === 'dunia' ? 'text-green-600' :
                        'text-red-600'
                      }`}>
                        {userLevel?.category === 'surga' ? 'Surga' :
                         userLevel?.category === 'dunia' ? 'Dunia' :
                         'Neraka'} {userLevel?.name}
                      </span>
                      {nextLevel && loyaltyNeeded > 0 && (
                        <span className="hidden lg:inline">
                          <span className="text-gray-600"> • Kurang </span>
                          <span className="font-semibold text-blue-600">{loyaltyNeeded.toLocaleString()}</span>
                          <span className="text-gray-600"> ke </span>
                          <span className={`font-bold ${
                            nextLevel?.category === 'surga' ? 'text-yellow-600' :
                            nextLevel?.category === 'dunia' ? 'text-green-600' :
                            'text-red-600'
                          }`}>
                            {nextLevel?.category === 'surga' ? 'Surga' :
                             nextLevel?.category === 'dunia' ? 'Dunia' :
                             'Neraka'} {nextLevel?.name}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            
            {/* Right: Auto Scroll Button */}
            {user && (
              <button
                onClick={() => scrollToCurrentUser()}
                className="bg-blue-500/80 hover:bg-blue-600/80 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm border border-blue-300/30 transition-colors flex items-center justify-center space-x-1 min-w-max"
                title="Scroll ke posisi Anda"
              >
                <span>📍</span>
                <span>Posisi Saya</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Ranking Canvas - Mobile Responsive with Scroll */}
      <div className="w-full overflow-auto">
        <RankingCanvas
          users={users}
          currentUserId={user?.id}
          currentUsername={user?.username}
          onUserClick={handleUserClick}
        />
      </div>

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
} // Component end
