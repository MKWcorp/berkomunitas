'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export function useProfileData() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [socialProfiles, setSocialProfiles] = useState([]);
  const [badges, setBadges] = useState([]);
  const [availableBadges, setAvailableBadges] = useState([]);
  const [level, setLevel] = useState({ 
    current: { level_number: 1, level_name: 'Pemula', required_points: 0 }, 
    next: null, 
    pointsToNextLevel: 0, 
    progressPercent: 0 
  });
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  // Auto-generate username for user if they don't have one
  const ensureUsername = async () => {
    try {
      const usernameRes = await fetch('/api/profil/username', { credentials: 'include' });
      const usernameData = await usernameRes.json();
      if (usernameData.auto_generated) {
        console.log('Auto-generated username for user:', usernameData.username);
      }
    } catch (error) {
      console.error('Error ensuring username:', error);
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/profil/dashboard', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch profile dashboard');
      
      const data = await response.json();
      setMember(data.member);
      setSocialProfiles(data.social_profiles || []);
      setBadges(data.badges || []);
      setLevel(data.level || level);
      
      // Fetch available badges
      const badgesRes = await fetch('/api/admin/badges');
      if (badgesRes.ok) {
        const badgesData = await badgesRes.json();
        setAvailableBadges(badgesData.badges || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const checkProfileCompleteness = async () => {
    try {
      const response = await fetch('/api/profil/check-completeness', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to check profile completeness');
      
      const data = await response.json();
      setIsProfileIncomplete(!data.isComplete);
    } catch (error) {
      console.error('Error checking profile completeness:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (isLoaded && user) {
        try {
          setLoading(true);
          await ensureUsername();
          await Promise.all([
            fetchDashboard(),
            checkProfileCompleteness()
          ]);
        } catch (error) {
          console.error('Error initializing profile:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    init();
  }, [isLoaded, user]);

  const refreshData = async () => {
    await Promise.all([
      fetchDashboard(),
      checkProfileCompleteness()
    ]);
  };

  return {
    loading,
    member,
    socialProfiles,
    badges,
    availableBadges,
    level,
    isProfileIncomplete,
    refreshData,
    setMember
  };
}
