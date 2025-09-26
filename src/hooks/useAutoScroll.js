'use client';

import { useEffect, useRef } from 'react';
import { findUserLevel } from '@/lib/rankingLevels';

const useAutoScroll = (users, currentUserId, currentUsername) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!users.length || !currentUserId || !containerRef.current) return;

    // Get current user email for additional matching
    let currentUserEmail = null;
    if (typeof window !== 'undefined' && window.Clerk?.user) {
      currentUserEmail = window.Clerk.user.primaryEmailAddress?.emailAddress;
    }

    // Find current user - try multiple matching strategies
    const currentUser = users.find(user => {
      // Try matching with clerk_id first (most reliable)
      if (user.clerk_id === currentUserId) return true;
      // Try matching with id field
      if (user.id === currentUserId) return true;
      // Try string comparison for ID
      if (user.id?.toString() === currentUserId?.toString()) return true;
      // Try matching with username as fallback
      if (user.username === currentUsername) return true;
      // Try matching with display_name
      if (user.display_name === currentUsername) return true;
      // Try matching with email
      if (currentUserEmail && user.email === currentUserEmail) return true;
      return false;
    });
    
    if (!currentUser) return;

    // Get user's level and calculate position
    const userLevel = findUserLevel(currentUser.total_loyalty);
    if (!userLevel) return;

    // Calculate scroll position to center user's level area
    const scrollTarget = userLevel.position.top + (userLevel.position.height / 2) - (window.innerHeight / 2);

    // Smooth scroll after component mounts
    const timer = setTimeout(() => {
      window.scrollTo({
        top: Math.max(0, scrollTarget),
        behavior: 'smooth'
      });
    }, 1000); // Delay to allow components to render

    return () => clearTimeout(timer);
  }, [users, currentUserId, currentUsername]);

  const scrollToUser = (userId = currentUserId, username = currentUsername) => {
    // Quick validation
    if (!users.length || !userId) {
      console.warn('Cannot scroll: no users data or user ID');
      return;
    }

    // Get current user email for fallback matching
    let currentUserEmail = null;
    if (typeof window !== 'undefined' && window.Clerk?.user) {
      currentUserEmail = window.Clerk.user.primaryEmailAddress?.emailAddress;
    }

    // Optimized user search
    const user = users.find(u => 
      u.clerk_id === userId || 
      u.id === userId || 
      u.username === username ||
      u.display_name === username ||
      (currentUserEmail && u.email === currentUserEmail)
    );
    
    if (!user) {
      console.warn('User not found in ranking');
      return;
    }

    const userLevel = findUserLevel(user.total_loyalty);
    if (!userLevel) {
      console.warn('No level found for user loyalty:', user.total_loyalty);
      return;
    }

    // Try to find the actual user avatar element on the page
    const userElements = document.querySelectorAll('[data-user-id]');
    let targetElement = null;
    
    // Find the user's avatar element
    for (let element of userElements) {
      const elementUserId = element.getAttribute('data-user-id');
      if (elementUserId === user.id?.toString() || 
          elementUserId === user.clerk_id ||
          elementUserId === user.username) {
        targetElement = element;
        break;
      }
    }

    let scrollTarget;
    
    if (targetElement) {
      // If we found the user element, scroll to it directly
      const rect = targetElement.getBoundingClientRect();
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      scrollTarget = currentScroll + rect.top - (window.innerHeight / 2);
    } else {
      // Fallback to level-based positioning
      scrollTarget = userLevel.position.top + (userLevel.position.height / 2) - (window.innerHeight / 2);
    }

    window.scrollTo({
      top: Math.max(0, scrollTarget),
      behavior: 'smooth'
    });
  };

  const scrollToLevel = (levelId) => {
    // Could implement level-specific scrolling
    // For navigation purposes
  };

  const autoScrollToCurrentUser = () => {
    scrollToUser(currentUserId, currentUsername);
  };

  return {
    containerRef,
    scrollToUser,
    scrollToLevel,
    autoScrollToCurrentUser
  };
};

export default useAutoScroll;
