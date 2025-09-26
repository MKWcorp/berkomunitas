'use client';
import { useState, useEffect, createContext, useContext } from 'react';

// Glass Theme Context
const GlassThemeContext = createContext();

/**
 * GlassThemeProvider - Global theme provider untuk glass design
 */
export function GlassThemeProvider({ children }) {
  const [theme, setTheme] = useState({
    variant: 'default',
    showAnimatedBg: true,
    blur: 'xl',
    opacity: '10'
  });

  const [screenSize, setScreenSize] = useState('desktop');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setScreenSize('mobile');
      } else if (window.innerWidth < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateTheme = (updates) => {
    setTheme(prev => ({ ...prev, ...updates }));
  };

  return (
    <GlassThemeContext.Provider value={{ 
      theme, 
      updateTheme, 
      screenSize 
    }}>
      {children}
    </GlassThemeContext.Provider>
  );
}

/**
 * useGlassTheme - Hook untuk menggunakan glass theme
 */
export function useGlassTheme() {
  const context = useContext(GlassThemeContext);
  if (!context) {
    throw new Error('useGlassTheme must be used within a GlassThemeProvider');
  }
  return context;
}

/**
 * useResponsive - Hook untuk responsive design
 */
export function useResponsive() {
  const [screenSize, setScreenSize] = useState('desktop');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      
      if (width < 640) {
        setScreenSize('mobile');
        setIsMobile(true);
        setIsTablet(false);
        setIsDesktop(false);
      } else if (width < 1024) {
        setScreenSize('tablet');
        setIsMobile(false);
        setIsTablet(true);
        setIsDesktop(false);
      } else {
        setScreenSize('desktop');
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    // Utility functions
    getResponsiveValue: (mobile, tablet, desktop) => {
      if (isMobile) return mobile;
      if (isTablet) return tablet;
      return desktop;
    },
    // Classes helpers
    responsive: {
      padding: isMobile ? 'p-4' : isTablet ? 'p-6' : 'p-8',
      margin: isMobile ? 'm-2' : isTablet ? 'm-4' : 'm-6',
      text: {
        title: isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl',
        subtitle: isMobile ? 'text-sm' : isTablet ? 'text-base' : 'text-lg',
        body: isMobile ? 'text-sm' : 'text-base'
      },
      grid: {
        cols: isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3',
        gap: isMobile ? 'gap-4' : isTablet ? 'gap-6' : 'gap-8'
      },
      container: {
        width: isMobile ? 'w-full' : isTablet ? 'max-w-4xl' : 'max-w-7xl',
        padding: isMobile ? 'px-4' : isTablet ? 'px-6' : 'px-8'
      }
    }
  };
}

/**
 * useGlassEffects - Hook untuk glass effects dengan performance optimization
 */
export function useGlassEffects() {
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const { screenSize } = useResponsive();

  useEffect(() => {
    // Disable heavy effects on mobile untuk performance
    const checkPerformance = () => {
      if (screenSize === 'mobile') {
        // Check if device supports backdrop-filter
        const supportsBackdrop = CSS.supports('backdrop-filter', 'blur(1px)');
        if (!supportsBackdrop) {
          setEffectsEnabled(false);
        }
      }
    };

    checkPerformance();
  }, [screenSize]);

  const getBlurClass = (intensity = 'xl') => {
    if (!effectsEnabled) return 'bg-white/90'; // Fallback tanpa blur
    
    const blurMap = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg', 
      xl: 'backdrop-blur-xl',
      '2xl': 'backdrop-blur-2xl',
      '3xl': 'backdrop-blur-3xl'
    };
    
    return blurMap[intensity] || 'backdrop-blur-xl';
  };

  const getGlassClasses = ({ 
    blur = 'xl', 
    opacity = '10',
    border = true,
    shadow = 'lg',
    hover = false 
  } = {}) => {
    const baseClasses = [
      effectsEnabled ? getBlurClass(blur) : 'bg-white/90',
      `bg-white/${opacity}`,
      border && 'border border-white/30',
      `shadow-${shadow}`,
      hover && 'hover:bg-white/15 hover:shadow-xl transition-all duration-300'
    ].filter(Boolean).join(' ');

    return baseClasses;
  };

  return {
    effectsEnabled,
    getBlurClass,
    getGlassClasses,
    // Responsive glass settings
    glassConfig: {
      mobile: {
        blur: 'md',
        opacity: '20',
        shadow: 'md'
      },
      tablet: {
        blur: 'lg', 
        opacity: '15',
        shadow: 'lg'
      },
      desktop: {
        blur: 'xl',
        opacity: '10',
        shadow: 'xl'
      }
    }[screenSize]
  };
}

/**
 * withGlassLayout - HOC untuk otomatis wrap dengan GlassLayout
 */
export function withGlassLayout(WrappedComponent, layoutProps = {}) {
  return function GlassWrappedComponent(props) {
    const GlassLayout = require('@/components/GlassLayout').default;
    
    return (
      <GlassLayout {...layoutProps}>
        <WrappedComponent {...props} />
      </GlassLayout>
    );
  };
}

/**
 * GlassResponsiveContainer - Container dengan responsive glass design
 */
export function GlassResponsiveContainer({ children, className = '' }) {
  const { responsive } = useResponsive();
  const { getGlassClasses, glassConfig } = useGlassEffects();
  
  const glassClasses = getGlassClasses({
    blur: glassConfig.blur,
    opacity: glassConfig.opacity,
    shadow: glassConfig.shadow,
    border: true,
    hover: true
  });

  return (
    <div className={`
      ${glassClasses}
      ${responsive.container.width}
      ${responsive.container.padding}
      ${responsive.padding}
      mx-auto rounded-2xl
      ${className}
    `}>
      {children}
    </div>
  );
}
