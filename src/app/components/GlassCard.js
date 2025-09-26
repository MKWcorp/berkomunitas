// DEPRECATED: Use /src/components/GlassLayout.js instead
// This file exists only for backward compatibility
// Please migrate to the new GlassLayout components

'use client';
import { forwardRef } from 'react';
import { usePathname } from 'next/navigation';
import { GlassCard as AdminGlassCard } from '@/components/GlassLayout';

/**
 * Original GlassCard implementation from main branch
 */
const OriginalGlassCard = forwardRef(({
  children,
  className = '',
  variant = 'default',
  padding = 'default',
  hover = false,
  ...props
}, ref) => {
  // Base glassmorphism styles (original main branch implementation)
  const baseStyles = "bg-white/20 backdrop-blur-lg border border-white/30 shadow-xl rounded-2xl";
  
  // Variant styles
  const variants = {
    default: "bg-white/20",
    strong: "bg-white/30",
    subtle: "bg-white/10",
    dark: "bg-black/20 border-white/20",
  };

  // Padding options
  const paddings = {
    none: "p-0",
    sm: "p-4",
    default: "p-6",
    lg: "p-8",
    xl: "p-10",
  };

  // Hover effects
  const hoverEffect = hover ? "transition-all duration-300 hover:bg-white/30 hover:shadow-2xl hover:scale-[1.02]" : "";
  
  const combinedClassName = `
    ${baseStyles}
    ${variants[variant]}
    ${paddings[padding]}
    ${hoverEffect}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div
      ref={ref}
      className={combinedClassName}
      {...props}
    >
      {children}
    </div>
  );
});

OriginalGlassCard.displayName = 'OriginalGlassCard';

/**
 * @deprecated Use GlassCard from @/components/GlassLayout or use original implementation
 * This component will be removed in a future version
 */
const GlassCard = forwardRef((props, ref) => {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin-app') || pathname.startsWith('/admin');
  
  // Use appropriate card based on route
  if (isAdminRoute) {
    return <AdminGlassCard ref={ref} {...props} />;
  } else {
    // Use original main branch implementation for public pages
    return <OriginalGlassCard ref={ref} {...props} />;
  }
});

GlassCard.displayName = 'GlassCard';

export default GlassCard;
