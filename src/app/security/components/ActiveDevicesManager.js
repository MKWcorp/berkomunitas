'use client';

import { useState, useEffect } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { 
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  GlobeAltIcon,
  MapPinIcon,
  ClockIcon,
  ShieldExclamationIcon,
  PowerIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function ActiveDevicesManager() {
  const { user, isLoaded } = useSSOUser();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // Fetch SSO sessions
  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchSessions = async () => {
      try {
        setIsLoadingSessions(true);
        const response = await fetch('/api/sso/sessions', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setSessions(data.sessions || []);
        } else {
          console.error('Failed to fetch sessions');
          setSessions([]);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setSessions([]);
      } finally {
        setIsLoadingSessions(false);
      }
    };

    fetchSessions();
  }, [isLoaded, user]);

  // Helper function to get device icon based on device type
  const getDeviceIcon = (deviceType) => {
    const deviceLower = deviceType?.toLowerCase() || '';
    
    if (deviceLower.includes('mobile') || deviceLower.includes('phone')) {
      return <DevicePhoneMobileIcon className="w-5 h-5" />;
    } else if (deviceLower.includes('tablet') || deviceLower.includes('ipad')) {
      return <DeviceTabletIcon className="w-5 h-5" />;
    } else {
      return <ComputerDesktopIcon className="w-5 h-5" />;
    }
  };

  // Helper function to get browser name and version
  const getBrowserInfo = (userAgent) => {
    if (!userAgent) return 'Unknown Browser';
    
    // Common browser detection
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      const match = userAgent.match(/Chrome\/([0-9.]+)/);
      return `Chrome ${match ? match[1].split('.')[0] : ''}`;
    } else if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/([0-9.]+)/);
      return `Firefox ${match ? match[1].split('.')[0] : ''}`;
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const match = userAgent.match(/Version\/([0-9.]+).*Safari/);
      return `Safari ${match ? match[1].split('.')[0] : ''}`;
    } else if (userAgent.includes('Edg')) {
      const match = userAgent.match(/Edg\/([0-9.]+)/);
      return `Edge ${match ? match[1].split('.')[0] : ''}`;
    } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
      return 'Opera';
    }
    
    return 'Unknown Browser';
  };

  // Helper function to get operating system
  const getOperatingSystem = (userAgent) => {
    if (!userAgent) return 'Unknown OS';
    
    if (userAgent.includes('Windows NT 10.0')) return 'Windows 10/11';
    if (userAgent.includes('Windows NT 6.3')) return 'Windows 8.1';
    if (userAgent.includes('Windows NT 6.1')) return 'Windows 7';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS X')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    
    return 'Unknown OS';
  };

  // Helper function to format last activity time
  const formatLastActivity = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  // Helper function to get location info
  const getLocationInfo = (session) => {
    const latestActivity = session.latestActivity;
    if (!latestActivity) return { city: 'Unknown', country: 'Unknown', ip: 'Unknown' };
    
    return {
      city: latestActivity.city || 'Unknown',
      country: latestActivity.country || 'Unknown', 
      ip: latestActivity.ipAddress || 'Unknown'
    };
  };
  // Handle session revoke
  const handleSignOut = async (session) => {
    const sessionId = session.id;
    setLoading(prev => ({ ...prev, [sessionId]: true }));
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/sso/revoke-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ sessionId })
      });

      if (response.ok) {
        // Remove session from list
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        setMessage({ 
          type: 'success', 
          text: 'Perangkat berhasil dikeluarkan dari akun Anda' 
        });
      } else {
        throw new Error('Failed to revoke session');
      }
    } catch (error) {
      console.error('Session revoke error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Terjadi kesalahan saat mengeluarkan perangkat' 
      });
    } finally {
      setLoading(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  // Confirm sign out
  const confirmSignOut = (session) => {
    const isCurrentSession = session.isCurrent;
    const deviceInfo = `${getBrowserInfo(session.userAgent)} on ${getOperatingSystem(session.userAgent)}`;
    
    if (isCurrentSession) {
      if (confirm(`Anda akan keluar dari perangkat saat ini (${deviceInfo}). Anda perlu login kembali. Lanjutkan?`)) {
        handleSignOut(session);
      }
    } else {
      if (confirm(`Keluarkan perangkat: ${deviceInfo}? Pengguna di perangkat tersebut akan perlu login kembali.`)) {
        handleSignOut(session);
      }
    }
  };

  if (!isLoaded || isLoadingSessions) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Memuat perangkat aktif...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Perangkat Aktif</h3>
          <p className="text-sm text-gray-600">
            Kelola perangkat yang sedang login ke akun Anda
          </p>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-3 rounded-lg text-sm border ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Sessions Summary */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldExclamationIcon className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Total Perangkat Aktif:</span>
          </div>
          <span className="text-2xl font-bold text-blue-600">
            {sessions?.length || 0}
          </span>
        </div>
      </div>

      {/* Active Sessions List */}      <div className="space-y-4">
        {sessions && sessions.length > 0 ? (
          sessions.map((session) => {
            const isCurrentSession = session.isCurrent;
            const browserInfo = getBrowserInfo(session.userAgent);
            const osInfo = getOperatingSystem(session.userAgent);
            const lastActivity = formatLastActivity(session.lastActivityAt);
            
            return (
              <div 
                key={session.id}
                className={`bg-white rounded-lg border-2 p-4 transition-all duration-200 ${
                  isCurrentSession 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  {/* Device Info */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Device Icon */}
                    <div className={`p-3 rounded-lg ${
                      isCurrentSession ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {getDeviceIcon(session.deviceType)}
                    </div>

                    {/* Device Details */}
                    <div className="flex-1 min-w-0">
                      {/* Browser & OS */}
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {browserInfo}
                        </h4>
                        {isCurrentSession && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            <CheckCircleIcon className="w-3 h-3" />
                            Perangkat Ini
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        {/* Operating System */}
                        <div className="flex items-center gap-2">
                          <ComputerDesktopIcon className="w-4 h-4" />
                          <span>{osInfo}</span>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="w-4 h-4" />
                          <span>
                            {session.ipAddress || 'Location Unknown'}
                          </span>
                        </div>

                        {/* IP Address */}
                        <div className="flex items-center gap-2">
                          <GlobeAltIcon className="w-4 h-4" />
                          <span className="font-mono text-xs">
                            {session.ipAddress || 'Unknown'}
                          </span>
                        </div>

                        {/* Last Activity */}
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4" />
                          <span>Last active: {lastActivity}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sign Out Button */}
                  <div className="ml-4">
                    <button
                      onClick={() => confirmSignOut(session)}
                      disabled={loading[session.id]}
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isCurrentSession
                          ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50 border border-orange-200'
                          : 'text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loading[session.id] ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          <span>Signing out...</span>
                        </>
                      ) : (
                        <>
                          <PowerIcon className="w-4 h-4" />
                          <span>{isCurrentSession ? 'Sign out' : 'Remove'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Session Details */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
                    <div>
                      <span className="font-medium">Session ID:</span>
                      <div className="font-mono bg-gray-100 p-1 rounded mt-1 break-all">
                        {session.id.substring(0, 20)}...
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>
                      <div className="mt-1">
                        {session.createdAt ? new Date(session.createdAt).toLocaleString() : 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <div className="mt-1">
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <DevicePhoneMobileIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Perangkat Aktif</h3>
            <p className="text-gray-600">
              Tidak ditemukan sesi aktif untuk akun Anda.
            </p>
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 mt-0.5">
            <ShieldExclamationIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-2">🔒 Tips Keamanan:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Periksa perangkat aktif secara berkala</li>
              <li>• Keluarkan perangkat yang tidak Anda kenali</li>
              <li>• Selalu logout dari perangkat umum/public</li>
              <li>• Laporkan aktivitas mencurigakan segera</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
