import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  BellIcon, 
  UserIcon, 
  ClipboardDocumentListIcon, 
  CurrencyDollarIcon, 
  TrophyIcon, 
  SpeakerWaveIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function NotificationBell() {
  const { user, isLoaded } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);
  const fetchTimeoutRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    let intervalId = null;

    const fetchWithCheck = async () => {
      if (isMountedRef.current && isLoaded && user) {
        await fetchNotifications();
      }
    };

    // Only fetch notifications if user is authenticated
    if (isLoaded) {
      if (user) {
        // Initial fetch
        fetchWithCheck();
        
        // Poll for new notifications every 60 seconds
        intervalId = setInterval(() => {
          if (isMountedRef.current) {
            fetchWithCheck();
          }
        }, 60000);
      } else {
        // Clear notifications if user is not authenticated
        setNotifications([]);
        setUnreadCount(0);
      }
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [isLoaded, user]);

  const fetchNotifications = async () => {
    // Early return if component is unmounted
    if (!isMountedRef.current) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/notifikasi?limit=10', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Check if component is still mounted before processing response
      if (!isMountedRef.current) {
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        
        if (isMountedRef.current && data.success && data.data) {
          setNotifications(data.data.notifications || []);
          setUnreadCount(data.data.pagination?.unread_count || 0);
        } else if (isMountedRef.current) {
          setNotifications([]);
          setUnreadCount(0);
        }
      } else if (response.status === 401) {
        // User not authenticated
        if (isMountedRef.current) {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    } catch (error) {
      // Silently handle errors to prevent "Failed to fetch" from showing to user
      if (isMountedRef.current) {
        console.warn('Notification fetch failed, will retry later');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const markAsRead = async (notificationIds) => {
    if (!isMountedRef.current) return;
    
    try {
      const response = await fetch('/api/notifikasi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_ids: notificationIds
        })
      });
      
      if (response.ok && isMountedRef.current) {
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      }
    } catch (error) {
      // Silently fail for mark as read operations
      console.warn('Failed to mark notifications as read');
    }
  };

  const markAllAsRead = async () => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/notifikasi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mark_all_read: true
        })
      });
      
      if (response.ok && isMountedRef.current) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      // Silently fail for mark all as read operations
      console.warn('Failed to mark all notifications as read');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      await markAsRead([notification.id]);
    }
    
    // Navigate to link if available
    if (notification.link_url) {
      window.location.href = notification.link_url;
    }
    
    setIsOpen(false);
  };

  const getNotificationCategory = (message) => {
    if (message.includes('wall profil')) return 'profile';
    if (message.includes('tugas')) return 'task';
    if (message.includes('poin')) return 'points';
    if (message.includes('badge') || message.includes('lencana')) return 'badge';
    return 'general';
  };  const getCategoryIcon = (category) => {
    const iconProps = { className: "w-4 h-4" };
    
    switch (category) {
      case 'profile': 
        return React.createElement(UserIcon, { className: "w-4 h-4 text-blue-500" });
      case 'task': 
        return React.createElement(ClipboardDocumentListIcon, { className: "w-4 h-4 text-green-500" });
      case 'points': 
        return React.createElement(CurrencyDollarIcon, { className: "w-4 h-4 text-yellow-500" });
      case 'badge': 
        return React.createElement(TrophyIcon, { className: "w-4 h-4 text-purple-500" });
      default: 
        return React.createElement(SpeakerWaveIcon, { className: "w-4 h-4 text-gray-500" });
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
    
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  return (
    <>
      {/* Only show notification bell if user is authenticated */}
      {isLoaded && user && (
        <div className="relative">
          {/* Notification Bell Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            
            {/* Unread Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BellIcon className="w-5 h-5 text-blue-600" />
                  Notifikasi
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      {unreadCount} baru
                    </span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Loading...' : 'Tandai semua'}
                  </button>
                )}
              </div>

              {/* Notification List with Scroll */}
              <div className="flex-1 overflow-y-auto max-h-96">
                {notifications.length === 0 ? (                  <div className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                      <BellIcon className="w-16 h-16 text-gray-300" />
                    </div>
                    <p className="text-gray-500">Belum ada notifikasi</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => {
                      const category = getNotificationCategory(notification.message);
                      return (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                                {getCategoryIcon(category)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <p className={`text-sm leading-5 ${!notification.is_read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                                {notification.message.length > 80 
                                  ? `${notification.message.substring(0, 80)}...` 
                                  : notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatTimeAgo(notification.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer with "Lihat Semua" */}
              <div className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">                <Link
                  href="/notifikasi"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full text-sm text-center text-blue-600 hover:text-blue-800 transition-colors font-medium py-2"
                >
                  <DocumentTextIcon className="w-4 h-4" />
                  Lihat Semua Notifikasi
                </Link>
              </div>
            </div>
          )}

          {/* Click outside to close */}
          {isOpen && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            ></div>
          )}
        </div>
      )}
    </>
  );
}
