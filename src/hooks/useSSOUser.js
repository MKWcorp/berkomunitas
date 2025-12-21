/**
 * useSSOUser - Custom hook to replace Clerk's useUser()
 * 
 * Usage:
 *   const { user, isLoaded, isSignedIn } = useSSOUser();
 * 
 * Returns:
 *   - user: User object from SSO (includes: id, email, google_id, username, etc.)
 *   - isLoaded: Boolean indicating if user data has been loaded
 *   - isSignedIn: Boolean indicating if user is authenticated
 */

'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/sso';

export function useSSOUser() {
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    // Get user from localStorage (synchronous)
    const ssoUser = getCurrentUser();
    
    if (ssoUser) {
      setUser(ssoUser);
      setIsSignedIn(true);
    } else {
      setUser(null);
      setIsSignedIn(false);
    }
    
    setIsLoaded(true);
  }, []);

  // Listen for storage changes (when user logs in/out in another tab)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'sso_user' || e.key === 'access_token') {
        const ssoUser = getCurrentUser();
        setUser(ssoUser);
        setIsSignedIn(!!ssoUser);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { user, isLoaded, isSignedIn };
}
