// useEventBoostSync.js - Hook untuk sinkronisasi real-time event boost
import { useEffect } from 'react';
import { useEventBoost } from './useEventBoost';

// Global event emitter untuk broadcast perubahan event
const eventChangeCallbacks = new Set();

export const emitEventChange = (eventType) => {
  eventChangeCallbacks.forEach(callback => callback(eventType));
};

export const useEventBoostSync = (eventType) => {
  const eventBoost = useEventBoost(eventType);

  useEffect(() => {
    const handleEventChange = (changedEventType) => {
      // Jika event yang berubah adalah event type kita, reload settings
      if (changedEventType === eventType || !changedEventType) {
        console.log(`Event change detected for ${eventType}, reloading...`);
        eventBoost.loadEventSettings();
      }
    };

    // Subscribe to event changes
    eventChangeCallbacks.add(handleEventChange);

    // Cleanup on unmount
    return () => {
      eventChangeCallbacks.delete(handleEventChange);
    };
  }, [eventType, eventBoost.loadEventSettings]);

  return eventBoost;
};

// Utility function to trigger refresh dari admin panel
export const triggerEventRefresh = async (eventType = null) => {
  try {
    // Emit change untuk semua listeners
    emitEventChange(eventType);
    
    // Optional: trigger server-side refresh jika diperlukan
    // await fetch('/api/events/refresh', { method: 'POST' });
    
    console.log('Event refresh triggered for:', eventType || 'all events');
  } catch (error) {
    console.error('Error triggering event refresh:', error);
  }
};
