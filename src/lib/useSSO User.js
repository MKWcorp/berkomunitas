/**
 * Custom Hook: useS SOUser
 * Replace Clerk's useUser with SSO-based user management
 */
'use client';

import { useState, useEffect } from 'react';
import { verifyToken, getCurrentUser, logout } from './sso';

export function useSSOUser() {
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          setUser(currentUser);
          setIsSignedIn(true);
        } else {
          setUser(null);
          setIsSignedIn(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setIsSignedIn(false);
      } finally {
        setIsLoaded(true);
      }
    }

    checkAuth();
  }, []);

  const signOut = async () => {
    await logout();
    setUser(null);
    setIsSignedIn(false);
    window.location.href = '/';
  };

  return {
    user,
    isLoaded,
    isSignedIn,
    signOut,
  };
}

/**
 * HOC: SignedIn - Render children only if user is signed in via SSO
 */
export function SignedIn({ children }) {
  const { isSignedIn, isLoaded } = useSSOUser();
  
  if (!isLoaded) return null;
  if (!isSignedIn) return null;
  
  return <>{children}</>;
}

/**
 * HOC: SignedOut - Render children only if user is NOT signed in
 */
export function SignedOut({ children }) {
  const { isSignedIn, isLoaded } = useSSOUser();
  
  if (!isLoaded) return null;
  if (isSignedIn) return null;
  
  return <>{children}</>;
}
