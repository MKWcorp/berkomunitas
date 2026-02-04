'use client';
import { useState, useEffect, useRef } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { useSearchParams } from 'next/navigation';

// Import components
import ProfileSection from './components/ProfileSection';
import TabNavigation from './components/TabNavigation';
import EditProfileTab from './components/EditProfileTab';
import BadgesTab from './components/BadgesTab';
import RewardsHistoryTab from './components/RewardsHistoryTab';
import EmailManager from './components/EmailManagerFixed';
import ExternalAccountsManager from './components/ExternalAccountsManager';
import PasswordManager from './components/PasswordManager';
import PhoneNumberManager from './components/PhoneNumberManager';
import EmailSocialManager from './components/EmailSocialManager';
import { NotificationMessage, ProfileIncompleteWarning } from './components/NotificationComponents';

const TABS = [
  { key: 'edit', label: 'Edit Profil' },
  { key: 'rewards', label: 'Rewards' },
  { key: 'badges', label: 'Lencana Saya' },
];

export default function ProfileDashboard() {
  const { user, isLoaded } = useSSOUser();
  const searchParams = useSearchParams();
  const isRequired = searchParams.get('required') === 'true';
  const fileInputRef = useRef(null);

  // State management
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('edit');
  const [message, setMessage] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Profile data state
  const [member, setMember] = useState(null);
  const [socialProfiles, setSocialProfiles] = useState([]);
  const [badges, setBadges] = useState([]);
  const [privileges, setPrivileges] = useState([]);
  const [rewardsHistory, setRewardsHistory] = useState([]);
  const [level, setLevel] = useState({ 
    current: { level_number: 1, level_name: 'Pemula', required_points: 0 }, 
    next: null, 
    pointsToNextLevel: 0, 
    progressPercent: 0 
  });
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  // Initialize profile data
  useEffect(() => {
    const ensureUsername = async () => {
      try {
        const usernameRes = await fetch('/api/profil/username', { credentials: 'include' });
        const usernameData = await usernameRes.json();
        if (!usernameData.has_username && usernameRes.ok) {
          console.log('Username will be auto-generated on first profile access');
        }
      } catch (err) {
        console.error('Error checking username:', err);
      }
    };

    const init = async () => {
      if (isLoaded && user) {
        try {
          await ensureUsername();
          
          // Try new API first, fallback to dashboard API
          let res = await fetch('/api/profil', { credentials: 'include' });
          let data = await res.json();
          
          if (!res.ok || !data) {
            // Fallback to dashboard API
            res = await fetch('/api/profil/dashboard', { credentials: 'include' });
            data = await res.json();
          }
          
          if (res.ok) {
            const d = data.data || data;
            setMember(d.member);
            setSocialProfiles(d.socialProfiles || []);
            setBadges(d.badges || []);
            setPrivileges(d.privileges || []);
            setLevel(d.level || level);
            setProfilePictureUrl(d.member?.foto_profil_url);
            
            const incomplete = !d.member?.nama_lengkap || !d.member?.nomer_wa || (d.socialProfiles || []).length === 0;
            setIsProfileIncomplete(incomplete);
          } else if (res.status === 401) {
            // Check if it's an old token issue
            if (data.oldToken || data.clearTokens) {
              console.log('[Profile] Detected old token, clearing and redirecting...');
              localStorage.clear();
              sessionStorage.clear();
              document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
              });
              window.location.href = '/login?oldToken=true';
              return;
            }
            setMessage('Silakan login untuk melihat profil.');
          } else {
            setMessage(data.error || 'Gagal memuat data profil');
          }
        } catch (err) {
          console.error('Error init profile:', err);
          setMessage('Terjadi kesalahan saat memuat profil');
        } finally {
          setLoading(false);
        }
      } else if (isLoaded && !user) {
        setLoading(false);
        setMessage('Silakan login untuk melihat profil.');
      }
    };

    init();
  }, [user, isLoaded]);

  // File upload handler
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Ukuran file maksimal 5MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/profil/upload-foto', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Upload gagal (${response.status})`);
      }

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error('Response bukan JSON yang valid.');
      }

      if (result?.success) {
        const url = result.foto_profil_url || result.data?.foto_profil_url;
        if (url) setProfilePictureUrl(url);
        setMessage('Foto profil berhasil diperbarui!');
      } else {
        throw new Error(result?.error || 'Gagal mengupload foto');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploading(false);
    }
  };

  // Auto dismiss messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        
        {/* Notification Message */}
        <NotificationMessage 
          message={message}
          onClose={() => setMessage('')}
        />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-2 sm:space-y-0">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Profil Dashboard
          </h1>
        </div>

        {/* Profile Incomplete Warning */}
        <ProfileIncompleteWarning 
          isRequired={isRequired}
          isProfileIncomplete={isProfileIncomplete}
        />

        {/* Profile Section */}
        <ProfileSection
          member={member}
          profilePictureUrl={profilePictureUrl}
          level={level}
          privileges={privileges}
          uploading={uploading}
          onFileChange={handleFileChange}
          fileInputRef={fileInputRef}
        />

        {/* Tab Navigation */}
        <TabNavigation
          tabs={TABS}
          activeTab={tab}
          onTabChange={setTab}
        />

        {/* Tab Content */}
        <div className="space-y-6">
          {tab === 'edit' && (
            <EditProfileTab
              member={member}
              socialProfiles={socialProfiles}
              message=""
              setMessage={setMessage}
            />
          )}
          
          {tab === 'rewards' && (
            <RewardsHistoryTab
              rewardsHistory={rewardsHistory}
              loading={loading}
            />
          )}
          
          {tab === 'badges' && (
            <BadgesTab
              badges={badges}
              level={level}
            />
          )}
        </div>

        {/* Legal Links */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <a href="/privacy-policy" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
          <span className="mx-2">|</span>
          <a href="/terms" className="hover:text-blue-600 transition-colors">Terms and Conditions</a>
        </div>

      </div>
    </div>
  );
}
