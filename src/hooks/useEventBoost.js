// useEventBoost.js - Custom hook untuk mengelola event boost settings
import { useState, useEffect } from 'react';

const EVENT_BOOST_SETTINGS = {  // Event boost utama
  MAIN_EVENT: {
    key: 'main_event_boost',
    isActive: false, // Event sudah berakhir - diatur ke false
    boostPercentage: 300,
    pointValue: 30, // Default point value saat boost aktif
    title: "EVENT SPESIAL: BOOST POINTS!",
    description: "Selesaikan tugas sekarang dan dapatkan poin loyalty berlipat!",
    startDate: "2024-12-01", // Tanggal event yang sudah berlalu
    endDate: "2024-12-15",   // Tanggal event yang sudah berlalu
  },
  
  // Bisa ditambahkan event boost lainnya di masa depan
  WEEKEND_BOOST: {
    key: 'weekend_boost',
    isActive: false,
    boostPercentage: 200,
    pointValue: 20,
    title: "WEEKEND BOOST: DOUBLE POINTS!",
    description: "Weekend spesial dengan double points untuk semua tugas!",
    startDate: null,
    endDate: null,
  },

  SPECIAL_BOOST: {
    key: 'special_boost',
    isActive: false,
    boostPercentage: 500,
    pointValue: 50,
    title: "MEGA BOOST: 5X POINTS!",
    description: "Event mega boost dengan 5x lipat points!",
    startDate: null,
    endDate: null,
  }
};

export const useEventBoost = (eventType = 'MAIN_EVENT') => {
  const [eventConfig, setEventConfig] = useState(EVENT_BOOST_SETTINGS[eventType]);
  const [isLoading, setIsLoading] = useState(false);

  // Function untuk mengecek apakah event masih dalam periode aktif
  const isEventInActivePeriod = (startDate, endDate) => {
    if (!startDate || !endDate) return true; // Jika tidak ada tanggal, anggap selalu aktif
    
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return now >= start && now <= end;
  };

  // Function untuk mengaktifkan event boost
  const activateEvent = (customConfig = {}) => {
    setEventConfig(prev => ({
      ...prev,
      ...customConfig,
      isActive: true
    }));
  };

  // Function untuk menonaktifkan event boost
  const deactivateEvent = () => {
    setEventConfig(prev => ({
      ...prev,
      isActive: false
    }));
  };

  // Function untuk mengupdate konfigurasi event
  const updateEventConfig = (newConfig) => {
    setEventConfig(prev => ({
      ...prev,
      ...newConfig
    }));
  };

  // Function untuk reset ke default settings
  const resetToDefault = () => {
    setEventConfig(EVENT_BOOST_SETTINGS[eventType]);
  };

  // Function untuk load event settings dari API
  const loadEventSettings = async () => {
    setIsLoading(true);
    try {
      // Try admin endpoint first, fallback to public endpoint
      let response;
      try {
        response = await fetch('/api/events');
      } catch (adminError) {
        console.log('Admin endpoint failed, trying public endpoint...');
        response = await fetch('/api/events/public');
      }
      
      // If admin endpoint returns 401/403, try public endpoint
      if (!response.ok && (response.status === 401 || response.status === 403)) {
        console.log('Admin endpoint unauthorized, trying public endpoint...');
        response = await fetch('/api/events/public');
      }
      
      if (response.ok) {
        const data = await response.json();
        const events = data.events || [];
        
        // Find active event that matches current eventType
        // Map eventType to actual database setting_name
        const settingNameMap = {
          'MAIN_EVENT': 'main_event_boost',
          'WEEKEND_BOOST': 'weekend_point_value', 
          'SPECIAL_BOOST': 'special_event_boost'
        };
        
        const dbSettingName = settingNameMap[eventType] || eventType;
        
        // Auto-activation: Event aktif jika dalam periode waktu, tanpa perlu setting_value = "true"
        const now = new Date();
        const activeEvent = events.find(event => {
          if (event.setting_name !== dbSettingName) return false;
          
          const startDate = new Date(event.start_date);
          const endDate = new Date(event.end_date);
          
          // Event otomatis aktif jika sekarang dalam periode start_date dan end_date
          const isInTimePeriod = now >= startDate && now <= endDate;
          
          // Parse setting_value sebagai boost percentage (numeric) atau activation flag (boolean)
          const settingValue = event.setting_value;
          const isNumericBoost = !isNaN(parseFloat(settingValue)) && parseFloat(settingValue) > 0;
          const isBooleanActive = settingValue === 'true' || settingValue === 'active';
          
          return isInTimePeriod && (isNumericBoost || isBooleanActive);
        });
        
        if (activeEvent) {
          // SIMPLIFIED: Hanya gunakan PERCENTAGE mode
          const settingValue = activeEvent.setting_value;
          let boostPercentage = EVENT_BOOST_SETTINGS[eventType]?.boostPercentage || 200;
          let pointValue = EVENT_BOOST_SETTINGS[eventType]?.pointValue || 20;
          
          // Parse setting_value sebagai PERCENTAGE langsung
          if (!isNaN(parseFloat(settingValue)) && parseFloat(settingValue) > 0) {
            boostPercentage = parseFloat(settingValue);
            pointValue = Math.round(boostPercentage / 10); // 200% = 20 poin, 300% = 30 poin
          }
          // Jika setting_value = "true" atau "active", gunakan default dari kode
          
          // Dynamic config dari database
          const dynamicConfig = {
            ...EVENT_BOOST_SETTINGS[eventType],
            isActive: true,
            boostPercentage: boostPercentage,
            pointValue: pointValue,
            multiplier: boostPercentage / 100, // Untuk N8N: 200% = 2.0, 300% = 3.0
            startDate: activeEvent.start_date,
            endDate: activeEvent.end_date,
            title: activeEvent.event_name || `EVENT BOOST: ${boostPercentage}% POINTS!`,
            description: activeEvent.description || `Dapatkan ${boostPercentage}% boost points untuk semua tugas!`,
            settingValue: settingValue, // Raw value untuk debugging
          };
          
          console.log(`🚀 Event Auto-Activated: ${activeEvent.setting_name}`, {
            settingValue,
            boostPercentage: `${boostPercentage}%`,
            multiplier: `${boostPercentage / 100}x`,
            pointValue,
            n8nFormula: `(10 * ${boostPercentage / 100}) = ${Math.round(10 * boostPercentage / 100)} poin`,
            startDate: activeEvent.start_date,
            endDate: activeEvent.end_date
          });
          
          setEventConfig(dynamicConfig);
        } else {
          // No active event found, use static settings with isActive false
          setEventConfig({
            ...EVENT_BOOST_SETTINGS[eventType],
            isActive: false
          });
        }
      } else {
        // Fallback to static settings
        setEventConfig(EVENT_BOOST_SETTINGS[eventType]);
      }
    } catch (error) {
      console.error('Error loading event settings:', error);
      setEventConfig(EVENT_BOOST_SETTINGS[eventType]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function untuk save event settings ke API  
  const saveEventSettings = async (settings) => {
    setIsLoading(true);
    try {
      // Create or update event in database
      const eventData = {
        setting_name: eventType,
        setting_value: settings.isActive ? 'true' : 'false',
        event_name: settings.title || EVENT_BOOST_SETTINGS[eventType].title,
        description: settings.description || EVENT_BOOST_SETTINGS[eventType].description,
        start_date: settings.startDate,
        end_date: settings.endDate
      };

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      
      if (response.ok) {
        setEventConfig(settings);
        console.log('Event settings saved to database');
      } else {
        const errorData = await response.json();
        console.error('Failed to save event settings:', errorData);
      }
    } catch (error) {
      console.error('Error saving event settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load settings saat hook pertama kali digunakan
  useEffect(() => {
    loadEventSettings();
  }, [eventType]);

  // Auto-check apakah event masih dalam periode aktif
  useEffect(() => {
    if (eventConfig?.isActive && eventConfig?.startDate && eventConfig?.endDate) {
      const stillActive = isEventInActivePeriod(eventConfig.startDate, eventConfig.endDate);
      if (!stillActive && eventConfig.isActive) {
        console.log('Event boost period ended, deactivating...');
        deactivateEvent();
      }
    }
  }, [eventConfig]);

  return {
    // Event configuration
    eventConfig,
    isActive: eventConfig?.isActive || false,
    boostPercentage: eventConfig?.boostPercentage || 100,
    pointValue: eventConfig?.pointValue || 10,
    title: eventConfig?.title || "Event Boost",
    description: eventConfig?.description || "Event boost aktif!",
    
    // Status
    isLoading,
    isInActivePeriod: isEventInActivePeriod(eventConfig?.startDate, eventConfig?.endDate),
    
    // Actions
    activateEvent,
    deactivateEvent,
    updateEventConfig,
    resetToDefault,
    loadEventSettings,
    saveEventSettings,
    
    // Utilities
    isEventInActivePeriod,
    
    // All available events
    availableEvents: Object.keys(EVENT_BOOST_SETTINGS)
  };
};

// Helper function untuk quick access ke main event
export const useMainEventBoost = () => useEventBoost('MAIN_EVENT');

// Export constants untuk penggunaan langsung
export { EVENT_BOOST_SETTINGS };

export default useEventBoost;
