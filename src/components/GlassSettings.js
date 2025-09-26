'use client';
import { useState, createContext, useContext } from 'react';

const GlassSettingsContext = createContext();

export function GlassSettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    // Theme modes
    mode: 'auto', // 'light', 'dark', 'auto'
    intensity: 'medium', // 'subtle', 'medium', 'strong'
    
    // Animation settings  
    animationsEnabled: true,
    reduceMotion: false,
    
    // Performance settings
    blurQuality: 'high', // 'low', 'medium', 'high'
    
    // Accessibility
    highContrast: false,
    fontSize: 'normal' // 'small', 'normal', 'large'
  });

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Presets
  const presets = {
    performance: {
      intensity: 'subtle',
      animationsEnabled: false,
      blurQuality: 'low'
    },
    accessibility: {
      highContrast: true,
      fontSize: 'large',
      reduceMotion: true
    },
    beautiful: {
      intensity: 'strong', 
      animationsEnabled: true,
      blurQuality: 'high'
    }
  };

  const applyPreset = (presetName) => {
    if (presets[presetName]) {
      updateSettings(presets[presetName]);
    }
  };

  return (
    <GlassSettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      applyPreset, 
      presets 
    }}>
      {children}
    </GlassSettingsContext.Provider>
  );
}

export const useGlassSettings = () => {
  const context = useContext(GlassSettingsContext);
  if (!context) {
    throw new Error('useGlassSettings must be used within GlassSettingsProvider');
  }
  return context;
};

// Glass Settings Panel Component
export function GlassSettingsPanel() {
  const { settings, updateSettings, applyPreset } = useGlassSettings();
  
  return (
    <div className="fixed top-4 right-4 z-50">
      <details className="backdrop-blur-xl bg-white/20 rounded-xl p-4">
        <summary className="cursor-pointer font-medium">🎨 Glass Settings</summary>
        
        <div className="mt-4 space-y-3 min-w-48">
          {/* Quick Presets */}
          <div>
            <label className="text-sm font-medium">Quick Presets:</label>
            <div className="flex gap-2 mt-1">
              <button 
                onClick={() => applyPreset('performance')}
                className="text-xs px-2 py-1 bg-blue-500/20 rounded"
              >
                ⚡ Performance
              </button>
              <button 
                onClick={() => applyPreset('beautiful')}
                className="text-xs px-2 py-1 bg-purple-500/20 rounded"
              >
                ✨ Beautiful
              </button>
            </div>
          </div>

          {/* Intensity */}
          <div>
            <label className="text-sm font-medium">Glass Intensity:</label>
            <select 
              value={settings.intensity}
              onChange={(e) => updateSettings({ intensity: e.target.value })}
              className="w-full text-xs bg-white/30 rounded px-2 py-1"
            >
              <option value="subtle">Subtle</option>
              <option value="medium">Medium</option>
              <option value="strong">Strong</option>
            </select>
          </div>

          {/* Animations */}
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox"
              checked={settings.animationsEnabled}
              onChange={(e) => updateSettings({ animationsEnabled: e.target.checked })}
            />
            Enable Animations
          </label>
        </div>
      </details>
    </div>
  );
}
