'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  BellIcon, 
  UserIcon, 
  ClipboardDocumentListIcon, 
  CurrencyDollarIcon, 
  TrophyIcon, 
  SpeakerWaveIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InboxIcon 
} from '@heroicons/react/24/outline';
import GlassCard from '../components/GlassCard';

export default function NotifikasiPage() {
  const { isSignedIn } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    dateRange: 'all',
    status: 'all'
  });
  const [pagination, setPagination] = useState({
    total: 0,
    unread_count: 0,
    limit: 20,
    offset: 0,
    has_more: false
  });

  useEffect(() => {
    if (isSignedIn) {
      fetchNotifications();
    }
  }, [isSignedIn, filters]);

  const fetchNotifications = async (loadMore = false) => {
    try {
      setLoading(!loadMore);
      
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: loadMore ? (pagination.offset + pagination.limit).toString() : '0'
      });

      if (filters.status === 'unread') {
        params.append('unread_only', 'true');
      }

      const response = await fetch(`/api/notifikasi?${params}`);
      if (response.ok) {
        const data = await response.json();
        
        if (loadMore) {
          setNotifications(prev => [...prev, ...data.data.notifications]);
          setPagination(prev => ({
            ...data.data.pagination,
            offset: prev.offset + prev.limit
          }));
        } else {
          setNotifications(data.data.notifications);
          setPagination(data.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
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
      
      setNotifications(prev => 
        prev.map(n => 
          notificationIds.includes(n.id) ? { ...n, is_read: true } : n
        )
      );
      setPagination(prev => ({
        ...prev,
        unread_count: Math.max(0, prev.unread_count - notificationIds.length)
      }));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
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
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setPagination(prev => ({ ...prev, unread_count: 0 }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotifications = async (notificationIds) => {
    try {
      const params = new URLSearchParams({
        ids: notificationIds.join(',')
      });
      
      await fetch(`/api/notifikasi?${params}`, {
        method: 'DELETE'
      });
      
      setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
      setPagination(prev => ({
        ...prev,
        total: prev.total - notificationIds.length
      }));
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead([notification.id]);
    }
    
    if (notification.link_url) {
      window.location.href = notification.link_url;
    }
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
      case 'profile': return <UserIcon className="h-5 w-5" />;
      case 'task': return <ClipboardDocumentListIcon className="h-5 w-5" />;
      case 'points': return <CurrencyDollarIcon className="h-5 w-5" />;
      case 'badge': return <TrophyIcon className="h-5 w-5" />;
      default: return <SpeakerWaveIcon className="h-5 w-5" />;
    }
  };

  const getCategoryName = (category) => {
    switch (category) {
      case 'profile': return 'Profil';
      case 'task': return 'Tugas';
      case 'points': return 'Poin';
      case 'badge': return 'Lencana';
      default: return 'Umum';
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
    
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredNotifications = notifications.filter(notification => {
    // Filter by category
    if (filters.category !== 'all') {
      const category = getNotificationCategory(notification.message);
      if (category !== filters.category) return false;
    }

    // Filter by status
    if (filters.status === 'unread' && notification.is_read) return false;
    if (filters.status === 'read' && !notification.is_read) return false;

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const notifDate = new Date(notification.created_at);
      const now = new Date();
      const diffInDays = Math.floor((now - notifDate) / (1000 * 60 * 60 * 24));
      
      if (filters.dateRange === 'today' && diffInDays > 0) return false;
      if (filters.dateRange === 'week' && diffInDays > 7) return false;
      if (filters.dateRange === 'month' && diffInDays > 30) return false;
    }

    return true;
  });

  if (!isSignedIn) {
    return (
      <GlassCard className="min-h-screen" padding="lg">
        <div className="flex items-center justify-center min-h-screen">
          <GlassCard className="text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Akses Ditolak</h1>
            <p className="text-gray-600">Silakan login untuk melihat notifikasi Anda.</p>
          </GlassCard>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="min-h-screen" padding="lg">
      <div className="container mx-auto">
        {/* Header */}
        <GlassCard className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 flex items-center">
                <BellIcon className="h-8 w-8 text-blue-500 mr-3" />
                Notifikasi
              </h1>
              <p className="text-gray-600">
                Total: {pagination.total} notifikasi
                {pagination.unread_count > 0 && (
                  <span className="ml-2 bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full border border-red-200">
                    {pagination.unread_count} belum dibaca
                  </span>
                )}
              </p>
            </div>
            
            {pagination.unread_count > 0 && (
              <button
                onClick={markAllAsRead}
                className="mt-4 md:mt-0 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 flex items-center"
              >
                <CheckIcon className="h-5 w-5 mr-2" />
                Tandai Semua Dibaca
              </button>
            )}
          </div>
        </GlassCard>

        {/* Filters */}
        <GlassCard className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MagnifyingGlassIcon className="h-6 w-6 text-blue-500 mr-2" />
            Filter Notifikasi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-white/70 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">Semua Kategori</option>
                <option value="profile">Profil</option>
                <option value="task">Tugas</option>
                <option value="points">Poin</option>
                <option value="badge">Lencana</option>
                <option value="general">Umum</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full bg-white/70 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">Semua Status</option>
                <option value="unread">Belum Dibaca</option>
                <option value="read">Sudah Dibaca</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full bg-white/70 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">Semua Waktu</option>
                <option value="today">Hari Ini</option>
                <option value="week">7 Hari Terakhir</option>
                <option value="month">30 Hari Terakhir</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Notifications List */}
        <GlassCard>
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <InboxIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Tidak ada notifikasi</h3>
              <p className="text-gray-600">
                {filters.category !== 'all' || filters.status !== 'all' || filters.dateRange !== 'all'
                  ? 'Tidak ada notifikasi yang sesuai dengan filter yang dipilih.'
                  : 'Belum ada notifikasi untuk Anda.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => {
                const category = getNotificationCategory(notification.message);
                return (
                  <div
                    key={notification.id}
                    className={`p-6 hover:bg-gray-50/80 transition-all duration-300 cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50/80 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-blue-600">
                          {getCategoryIcon(category)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                            {getCategoryName(category)}
                          </span>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        
                        <p className={`text-sm mb-2 ${!notification.is_read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                          {notification.message}
                        </p>
                        
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotifications([notification.id]);
                          }}
                          className="text-gray-500 hover:text-red-600 transition-colors p-2 rounded-xl hover:bg-red-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {pagination.has_more && (
            <div className="p-6 border-t border-gray-200 text-center">
              <button
                onClick={() => fetchNotifications(true)}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Memuat...' : 'Muat Lebih Banyak'}
              </button>
            </div>
          )}
        </GlassCard>
      </div>
    </GlassCard>
  );
}
