import { useState, useEffect } from 'react';
import { useSSOUser } from './useSSOUser';

export function useProfileCompletion() {
  const { user, isLoaded } = useSSOUser();
  const [profileStatus, setProfileStatus] = useState({
    isComplete: null,
    loading: true,
    error: null,
    member: null,
    socialMediaProfiles: [],
    message: ''
  });

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      setProfileStatus(prev => ({
        ...prev,
        isComplete: false,
        loading: false,
        message: 'Please sign in'
      }));
      return;
    }    const checkCompletion = async () => {
      try {
        const response = await fetch('/api/profil/check-completeness', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to check profile completion');
        }

        const data = await response.json();
        
        setProfileStatus({
          isComplete: data.isComplete,
          loading: false,
          error: null,
          member: data.member,
          socialMediaProfiles: data.socialMediaProfiles || [],
          message: data.message || ''
        });
        
      } catch (error) {
        console.error('Error checking profile completion:', error);
        setProfileStatus(prev => ({
          ...prev,
          loading: false,
          error: error.message,
          isComplete: false
        }));
      }
    };

    checkCompletion();
  }, [isLoaded, user]);
  const refresh = async () => {
    setProfileStatus(prev => ({ ...prev, loading: true }));
    // Trigger re-check by updating the effect dependency
    if (isLoaded && user) {
      try {
        const response = await fetch('/api/profil/check-completeness', {
          credentials: 'include'
        });
        const data = await response.json();
        setProfileStatus({
          isComplete: data.isComplete,
          loading: false,
          error: null,
          member: data.member,
          socialMediaProfiles: data.socialMediaProfiles || [],
          message: data.message || ''
        });
      } catch (error) {
        setProfileStatus(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    }
  };

  return {
    ...profileStatus,
    refresh
  };
}
