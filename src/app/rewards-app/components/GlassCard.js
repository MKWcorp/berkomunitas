'use client';

/**
 * Temporary GlassCard component specifically for rewards-app
 * Using simple glass morphism styles without dependencies
 */
export default function GlassCard({ 
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
    <div 
      className={`
        backdrop-blur-lg 
        bg-gradient-to-br ${gradients[gradient]} 
        border rounded-2xl 
        p-6
        shadow-2xl
        hover:scale-105 transition-all duration-300 
        ${className}
      `.trim().replace(/\s+/g, ' ')}
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
    </div>
  );
}