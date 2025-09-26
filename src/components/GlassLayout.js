'use client';
import { useEffect, useState } from 'react';

/**
 * GlassLayout - Full screen glass design wrapper component
 * Provides automatic glass morphism styling with animated backgrounds
 */
export default function GlassLayout({ 
  children, 
  variant = 'default',
  showAnimatedBg = true,
  className = '',
  containerClassName = '' 
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const variants = {
    default: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
    admin: 'bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50',
    user: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50',
    dark: 'bg-gradient-to-br from-gray-900 via-slate-900 to-black',
    sunset: 'bg-gradient-to-br from-orange-50 via-pink-50 to-red-50',
    ocean: 'bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50'
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${variants[variant]} relative overflow-hidden ${className}`}>
      {/* Animated Background Elements */}
      {showAnimatedBg && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Primary floating orb */}
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 backdrop-blur-3xl animate-pulse"></div>
          
          {/* Secondary floating orb */}
          <div className="absolute top-1/3 -left-40 w-96 h-96 rounded-full bg-gradient-to-r from-blue-400/20 to-cyan-400/20 backdrop-blur-3xl animate-pulse delay-1000"></div>
          
          {/* Tertiary floating orb */}
          <div className="absolute -bottom-40 right-1/3 w-80 h-80 rounded-full bg-gradient-to-r from-indigo-400/20 to-purple-400/20 backdrop-blur-3xl animate-pulse delay-2000"></div>
          
          {/* Additional smaller orbs for more depth */}
          <div className="absolute top-20 right-1/4 w-40 h-40 rounded-full bg-gradient-to-r from-yellow-400/10 to-orange-400/10 backdrop-blur-2xl animate-bounce delay-500"></div>
          <div className="absolute bottom-1/4 left-1/4 w-60 h-60 rounded-full bg-gradient-to-r from-green-400/15 to-emerald-400/15 backdrop-blur-2xl animate-pulse delay-3000"></div>
          
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[0.5px]" 
               style={{
                 backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                 backgroundSize: '20px 20px'
               }}>
          </div>
        </div>
      )}
      
      {/* Main Content Container */}
      <div className={`relative z-10 ${containerClassName}`}>
        {children}
      </div>
    </div>
  );
}

/**
 * GlassContainer - Reusable glass morphism container
 */
export function GlassContainer({ 
  children, 
  className = '', 
  blur = 'xl',
  opacity = '10',
  rounded = '2xl',
  shadow = '2xl',
  border = true,
  hover = false,
  padding = '6'
}) {
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md', 
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
    '2xl': 'backdrop-blur-2xl',
    '3xl': 'backdrop-blur-3xl'
  };

  const baseClasses = `
    ${blurClasses[blur]} 
    bg-white/${opacity} 
    ${border ? `border border-white/30` : ''} 
    rounded-${rounded} 
    shadow-${shadow} 
    p-${padding}
    ${hover ? 'hover:bg-white/15 hover:shadow-3xl transition-all duration-300' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={baseClasses}>
      {children}
    </div>
  );
}

/**
 * GlassCard - Specialized card with glass effect
 */
export function GlassCard({ 
  children, 
  title,
  subtitle,
  icon: Icon,
  className = '',
  gradient = 'blue',
  ...props 
}) {
  const gradients = {
    blue: 'from-blue-500/10 to-blue-600/20 border-blue-400/30',
    green: 'from-green-500/10 to-green-600/20 border-green-400/30',
    purple: 'from-purple-500/10 to-purple-600/20 border-purple-400/30',
    red: 'from-red-500/10 to-red-600/20 border-red-400/30',
    yellow: 'from-yellow-500/10 to-yellow-600/20 border-yellow-400/30',
    pink: 'from-pink-500/10 to-pink-600/20 border-pink-400/30'
  };

  return (
    <GlassContainer 
      className={`bg-gradient-to-br ${gradients[gradient]} hover:scale-105 transition-all duration-300 ${className}`}
      {...props}
    >
      {(title || subtitle || Icon) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className={`backdrop-blur-lg bg-${gradient}-500/20 p-3 rounded-xl shadow-lg`}>
              <Icon className={`w-6 h-6 text-${gradient}-600`} />
            </div>
          )}
        </div>
      )}
      {children}
    </GlassContainer>
  );
}

/**
 * GlassButton - Button with glass morphism effect
 */
export function GlassButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  const variants = {
    primary: 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-400/30 text-blue-800',
    secondary: 'bg-gray-500/20 hover:bg-gray-500/30 border-gray-400/30 text-gray-800',
    success: 'bg-green-500/20 hover:bg-green-500/30 border-green-400/30 text-green-800',
    danger: 'bg-red-500/20 hover:bg-red-500/30 border-red-400/30 text-red-800',
    warning: 'bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-400/30 text-yellow-800'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`
        backdrop-blur-lg border rounded-xl font-medium
        transition-all duration-200 hover:scale-105 hover:shadow-lg
        ${variants[variant]} ${sizes[size]} ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {children}
    </button>
  );
}
