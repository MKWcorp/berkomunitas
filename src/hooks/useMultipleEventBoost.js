// useMultipleEventBoost.js - Hook untuk mengelola multiple events sekaligus
import { useState, useEffect } from 'react';

export const useMultipleEventBoost = () => {
  const [allEvents, setAllEvents] = useState([]);
  const [activeEvents, setActiveEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAllEvents = async () => {
    setIsLoading(true);
    try {
      // Try admin endpoint first, fallback to public endpoint
      let response;
      let lastError = null;
      
      try {
        console.log('🔄 Trying admin events endpoint...');
        response = await fetch('/api/events');
        
        if (!response.ok && (response.status === 401 || response.status === 403)) {
          console.log('🔄 Admin endpoint unauthorized, trying public endpoint...');
          response = await fetch('/api/events/public');
        }
      } catch (adminError) {
        console.log('🔄 Admin endpoint failed, trying public endpoint...', adminError.message);
        lastError = adminError;
        try {
          response = await fetch('/api/events/public');
        } catch (publicError) {
          console.error('❌ Both endpoints failed:', { adminError, publicError });
          throw new Error(`Both API endpoints failed: Admin (${adminError.message}), Public (${publicError.message})`);
        }
      }
      
      if (response && response.ok) {
        const data = await response.json();
        const events = data.events || [];
        
        console.log('📊 Events received from API:', events.length);
        
        // Process all events untuk auto-activation
        const processedEvents = events.map(event => {
          const now = new Date();
          const startDate = new Date(event.start_date);
          const endDate = new Date(event.end_date);
          
          // Auto-activation logic
          const isInTimePeriod = now >= startDate && now <= endDate;
          const settingValue = event.setting_value;
          const isNumericBoost = !isNaN(parseFloat(settingValue)) && parseFloat(settingValue) > 0;
          const isBooleanActive = settingValue === 'true' || settingValue === 'active';
          
          const isActive = isInTimePeriod && (isNumericBoost || isBooleanActive);
          
          // Parse boost percentage
          let boostPercentage = 200; // default
          let pointValue = 20; // default
          
          if (isNumericBoost) {
            boostPercentage = parseFloat(settingValue);
            pointValue = Math.round(boostPercentage / 10);
          }
          
          return {
            ...event,
            isActive,
            boostPercentage,
            pointValue,
            title: event.event_name || `${event.setting_name.toUpperCase()} BOOST`,
            timeLeft: isActive ? endDate.getTime() - now.getTime() : null,
            status: isActive ? 'active' : 
                   (now < startDate ? 'upcoming' : 'expired')
          };
        });
        
        setAllEvents(processedEvents);
        setActiveEvents(processedEvents.filter(event => event.isActive));
        
        console.log('📊 All Events Loaded:', processedEvents.length);
        console.log('✅ Active Events:', processedEvents.filter(e => e.isActive).length);
        
      } else {
        console.error('❌ API response not ok:', response?.status, response?.statusText);
        // Set empty arrays as fallback
        setAllEvents([]);
        setActiveEvents([]);
      }
    } catch (error) {
      console.error('❌ Error loading multiple events:', error);
      // Set empty arrays as fallback to prevent app crashes
      setAllEvents([]);
      setActiveEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh setiap 30 detik untuk real-time activation
  useEffect(() => {
    loadAllEvents();
    const interval = setInterval(loadAllEvents, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Helper functions
  const getHighestBoostEvent = () => {
    return activeEvents.reduce((highest, current) => 
      current.boostPercentage > (highest?.boostPercentage || 0) ? current : highest, null
    );
  };

  const getTotalBoostPercentage = () => {
    return activeEvents.reduce((total, event) => total + event.boostPercentage, 0);
  };

  const getEventByName = (settingName) => {
    return allEvents.find(event => event.setting_name === settingName);
  };

  const getUpcomingEvents = () => {
    return allEvents.filter(event => event.status === 'upcoming')
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  };

  return {
    // Data
    allEvents,
    activeEvents,
    upcomingEvents: getUpcomingEvents(),
    expiredEvents: allEvents.filter(event => event.status === 'expired'),
    
    // Status
    isLoading,
    hasActiveEvents: activeEvents.length > 0,
    activeEventCount: activeEvents.length,
    
    // Computed values
    highestBoostEvent: getHighestBoostEvent(),
    totalBoostPercentage: getTotalBoostPercentage(),
    
    // Actions
    refreshEvents: loadAllEvents,
    getEventByName,
    
    // Utilities
    isEventActive: (settingName) => activeEvents.some(e => e.setting_name === settingName)
  };
};

export default useMultipleEventBoost;
