'use client';
import { useState, useRef } from 'react';

export function usePhotoUpload() {
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const uploadPhoto = async (file) => {
    if (!file || uploading) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await fetch('/api/profil/upload-foto', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const data = await response.json();
      setProfilePictureUrl(data.foto_url);
      return { success: true, url: data.foto_url };
    } catch (error) {
      console.error('Error uploading photo:', error);
      return { success: false, error: error.message };
    } finally {
      setUploading(false);
    }
  };

  const fetchCurrentPhoto = async () => {
    try {
      const response = await fetch('/api/profil', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.foto_url) {
          setProfilePictureUrl(data.foto_url);
        }
      }
    } catch (error) {
      console.error('Error fetching profile photo:', error);
    }
  };

  return {
    profilePictureUrl,
    uploading,
    fileInputRef,
    uploadPhoto,
    fetchCurrentPhoto,
    setProfilePictureUrl
  };
}
