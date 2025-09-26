import { useState, useEffect } from 'react';
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

  useEffect(() => {
    let intervalId = null;
    let isMounted = true;

    const fetchWithCheck = async () => {
      if (isMounted && isLoaded && user) {
        await fetchNotifications();
      }
    };

    // Only fetch notifications if user is authenticated
    if (isLoaded && user) {
      // Initial fetch
      fetchWithCheck();
      
      // Poll for new notifications every 30 seconds
      intervalId = setInterval(fetchWithCheck, 30000);
    } else if (isLoaded && !user) {
      // Clear notifications if user is not authenticated
      setNotifications([]);
      setUnreadCount(0);
    }

    // Cleanup function
    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoaded, user]);

  const fetchNotifications = async () => {
    let retries = 0;
    const maxRetries = 2;
    while (retries <= maxRetries) {
      try {
        setLoading(true);
        // Only fetch 10 latest notifications for the dropdown
        const response = await fetch('/api/notifikasi?limit=10', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setNotifications(data.data.notifications || []);
            setUnreadCount(data.data.pagination?.unread_count || 0);
          } else {
            console.warn('Invalid notification data structure:', data);
            setNotifications([]);
            setUnreadCount(0);
          }
          setLoading(false);
          return;
        } else if (response.status === 401) {
          // User not authenticated, silently skip
          setNotifications([]);
          setUnreadCount(0);
          setLoading(false);
          return;
        } else {
          // Silently handle development API errors
          if (process.env.NODE_ENV === 'development') {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
          }
          throw new Error('Server error: ' + response.status);
        }
      } catch (err) {
        retries++;
        if (retries > maxRetries) {
          setNotifications([]);
          setUnreadCount(0);
          setLoading(false);
          // Only log errors in production
          if (process.env.NODE_ENV === 'production') {
            console.error('Gagal memuat notifikasi. Silakan cek koneksi Anda atau coba lagi nanti.', err);
          }
          return;
        }
        // Wait 1s before retrying
        await new Promise(res => setTimeout(res, 1000));
      }
    }
  };

  const markAsRead = async (notificationIds) => {
    try {
      await fetch('/api/notifikasi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_ids: notificationIds
        })
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          notificationIds.includes(n.id) ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await fetch('/api/notifikasi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mark_all_read: true
        })
      });
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setLoading(false);
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
  };
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'profile': return <UserIcon className="h-4 w-4 text-blue-600" />;
      case 'task': return <ClipboardDocumentListIcon className="h-4 w-4 text-green-600" />;
      case 'points': return <CurrencyDollarIcon className="h-4 w-4 text-amber-600" />;
      case 'badge': return <TrophyIcon className="h-4 w-4 text-purple-600" />;
      default: return <SpeakerWaveIcon className="h-4 w-4 text-gray-600" />;
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
        <div className="absolute right-0 mt-2 w-96 bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl z-50 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BellIcon className="h-5 w-5 text-blue-600 mr-2" />
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
            {notifications.length === 0 ? (              <div className="p-8 text-center">
                <BellIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
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
          <div className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <Link              href="/notifikasi"
              onClick={() => setIsOpen(false)}
              className="block w-full text-sm text-center text-blue-600 hover:text-blue-800 transition-colors font-medium py-2 flex items-center justify-center"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
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
