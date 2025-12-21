'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSSOUser } from '@/hooks/useSSOUser';
import { ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

// Hooks
import { useProfileData } from './hooks/useProfileData';
import { usePhotoUpload } from './hooks/usePhotoUpload';

// Components
import ProfileHeader from './components/ProfileHeader';
import ProfileEditForm from './components/ProfileEditForm';
import BadgesSection from './components/BadgesSection';
import DuplicateDataDialog from '../components/DuplicateDataDialog';
import { GlassCard } from '@/components/GlassLayout';

const TABS = [
  { key: 'edit', label: 'Edit Profil' },
  { key: 'badges', label: 'Lencana Saya' },
];

export default function ProfileDashboard() {
  const { user, isLoaded } = useSSOUser();
  const searchParams = useSearchParams();
  const isRequired = searchParams.get('required') === 'true';
  
  // Local state
  const [tab, setTab] = useState('edit');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Custom hooks
  const {
    loading,
    member,
    socialProfiles,
    badges,
    availableBadges,
    level,
    isProfileIncomplete,
    refreshData,
    setMember
  } = useProfileData();

  const {
    profilePictureUrl,
    uploading,
    uploadPhoto,
    fetchCurrentPhoto,
    setProfilePictureUrl
  } = usePhotoUpload();

  // Initialize photo on load
  useEffect(() => {
    if (member?.foto_url) {
      setProfilePictureUrl(member.foto_url);
    } else if (!loading) {
      fetchCurrentPhoto();
    }
  }, [member, loading]);

  // Handle photo upload
  const handlePhotoUpload = async (file) => {
    const result = await uploadPhoto(file);
    if (result.success) {
      setMessage('Foto profil berhasil diperbarui!');
      setTimeout(() => setMessage(''), 3000);
      await refreshData();
    } else {
      setMessage(`Error: ${result.error}`);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  // Handle profile save
  const handleProfileSave = async (formData) => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/profil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      
      if (data.duplicateData && data.duplicateData.length > 0) {
        // Handle duplicate data case
        setDuplicateData(data.duplicateData);
        setShowDuplicateDialog(true);
      } else {
        setMessage('Profil berhasil diperbarui!');
        await refreshData();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error: Gagal memperbarui profil');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Profile Header */}
        <ProfileHeader
          member={member}
          level={level}
          profilePictureUrl={profilePictureUrl}
          onPhotoUpload={handlePhotoUpload}
          uploading={uploading}
        />

        {/* Profile Incomplete Warning */}
        {isProfileIncomplete && (
          <div className="bg-orange-100/80 border border-orange-400 text-orange-800 px-6 py-4 rounded-2xl">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-orange-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800">
                  Profil Anda belum lengkap
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  Lengkapi profil Anda untuk mendapatkan pengalaman yang lebih baik di platform kami.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Required Profile Warning */}
        {isRequired && (
          <div className="bg-red-100/80 border border-red-400 text-red-800 px-6 py-4 rounded-2xl">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Profil Wajib Dilengkapi
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Anda harus melengkapi profil untuk melanjutkan menggunakan fitur-fitur platform.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <GlassCard className="p-1">
          <div className="flex space-x-1">
            {TABS.map((tabItem) => (
              <button
                key={tabItem.key}
                onClick={() => setTab(tabItem.key)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                  tab === tabItem.key
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-white/50'
                }`}
              >
                {tabItem.label}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Tab Content */}
        <div>
          {tab === 'edit' && (
            <ProfileEditForm
              member={member}
              socialProfiles={socialProfiles}
              onSave={handleProfileSave}
              saving={saving}
              message={message}
            />
          )}
          
          {tab === 'badges' && (
            <BadgesSection
              badges={badges}
              availableBadges={availableBadges}
            />
          )}
        </div>
      </div>
    </div>
  );
}
