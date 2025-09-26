'use client';
import { useState } from 'react';
import { GlassContainer, GlassCard, GlassButton } from '@/components/GlassLayout';
import { useResponsive, useGlassEffects } from '@/hooks/useGlassTheme';

// NOTE: AdminNavbar removed - use AdminNavigationMenu in AdminLayout instead

export function AdminPageHeader({ title, description, children, actions }) {
  const { responsive, isMobile, isTablet } = useResponsive();
  const { getGlassClasses, glassConfig } = useGlassEffects();

  return (
    <GlassContainer className="p-6" blur="xl" opacity="20" hover={true}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600 mt-1">{description}</p>
          )}
        </div>
        {(actions || children) && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {actions || children}
          </div>
        )}
      </div>
    </GlassContainer>
  );
}

export function AdminStatsGrid({ stats = [], columns = 4 }) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3', 
    4: 'grid-cols-1 md:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  };

  const gradientColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    indigo: 'text-indigo-600',
    pink: 'text-pink-600'
  };

  return (
    <div className={`grid ${gridCols[columns] || gridCols[4]} gap-4`}>
      {stats.map((stat, index) => (
        <GlassCard 
          key={index} 
          title={stat.title} 
          gradient={stat.gradient || 'blue'} 
          className="p-4"
        >
          <div className={`text-2xl font-bold ${gradientColors[stat.gradient] || 'text-blue-600'}`}>
            {typeof stat.value === 'number' ? stat.value.toLocaleString('id-ID') : stat.value}
          </div>
          {stat.description && (
            <p className="text-sm text-gray-500 mt-1">{stat.description}</p>
          )}
        </GlassCard>
      ))}
    </div>
  );
}

export function AdminContentContainer({ children, className = "" }) {
  return (
    <GlassContainer className={`p-6 ${className}`} blur="lg" opacity="15">
      <div className="min-h-[400px]">
        {children}
      </div>
    </GlassContainer>
  );
}

export function AdminEmptyState({ 
  title = "Tidak ada data", 
  description = "Belum ada data tersedia", 
  actionText, 
  onAction,
  icon: Icon
}) {
  return (
    <div className="text-center py-12">
      {Icon && (
        <Icon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
      )}
      <div className="text-gray-400 text-lg mb-2">{title}</div>
      <p className="text-gray-500 text-sm mt-2">{description}</p>
      {actionText && onAction && (
        <GlassButton 
          onClick={onAction}
          variant="primary"
          className="mt-4"
        >
          {actionText}
        </GlassButton>
      )}
    </div>
  );
}

export function AdminTableContainer({ children, className = "" }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full">
        {children}
      </table>
    </div>
  );
}

export function AdminTableHeader({ children }) {
  return (
    <thead>
      <tr className="border-b border-white/20">
        {children}
      </tr>
    </thead>
  );
}

export function AdminTableHeaderCell({ children, onClick, sortable = false, sortDirection, className = "" }) {
  const baseClasses = "text-left py-3 px-2 font-semibold text-gray-800";
  const interactiveClasses = sortable ? "cursor-pointer hover:text-blue-600 transition-colors" : "";
  
  const getSortIcon = () => {
    if (!sortable) return '';
    if (!sortDirection) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <th 
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      onClick={sortable ? onClick : undefined}
    >
      {children}{getSortIcon()}
    </th>
  );
}

export function AdminTableBody({ children }) {
  return (
    <tbody>
      {children}
    </tbody>
  );
}

export function AdminTableRow({ children, className = "", ...props }) {
  return (
    <tr 
      className={`border-b border-white/10 hover:bg-white/10 transition-colors ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function AdminTableCell({ children, className = "" }) {
  return (
    <td className={`py-3 px-2 text-sm ${className}`}>
      {children}
    </td>
  );
}

export function AdminSearchInput({ 
  value, 
  onChange, 
  onKeyPress, 
  placeholder = "Cari...", 
  className = "" 
}) {
  return (
    <input
      type="text"
      className={`backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-gray-600 ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyPress={onKeyPress}
    />
  );
}

export function AdminSearchButton({ onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`backdrop-blur-lg bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-700 px-4 py-2 rounded-xl flex items-center gap-1 transition-all duration-200 ${className}`}
      title="Cari"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </button>
  );
}

export function AdminPageLayout({ children, className = "" }) {
  return (
    <div className={`max-w-full mx-auto space-y-6 p-6 ${className}`}>
      {children}
    </div>
  );
}

// Status Badge Component
export function AdminStatusBadge({ status, variant = 'default' }) {
  const variants = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800', 
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800'
  };

  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {status}
    </span>
  );
}

// Action Button Group
export function AdminActionButtons({ actions = [] }) {
  return (
    <div className="flex items-center gap-1">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className={`p-1 rounded transition-colors ${action.className || 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`}
          title={action.title}
        >
          {action.icon && <action.icon className="h-4 w-4" />}
        </button>
      ))}
    </div>
  );
}
