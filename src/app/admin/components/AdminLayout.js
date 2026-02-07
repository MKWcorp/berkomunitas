'use client';
import { useState } from 'react';
import { 
  ChartBarSquareIcon, 
  GiftIcon, 
  SparklesIcon, 
  TrophyIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  UsersIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import GlassCard from '../../components/GlassCard';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: ChartBarSquareIcon },
  { key: 'rewards', label: 'Kelola Hadiah', icon: GiftIcon },
  { key: 'badges', label: 'Kelola Lencana', icon: SparklesIcon },
  { key: 'levels', label: 'Kelola Level', icon: TrophyIcon },
  { key: 'tugas', label: 'Kelola Tugas', icon: ClipboardDocumentListIcon },
  { key: 'privileges', label: 'Kelola Hak Akses', icon: ShieldCheckIcon },
  { key: 'points', label: 'Monitoring Poin', icon: CurrencyDollarIcon },  { key: 'members', label: 'Kelola Member', icon: UsersIcon },
  { key: 'social-media', label: 'Profil Sosial Media', icon: GlobeAltIcon },
  { key: 'generate-photos', label: 'Generate Foto', icon: PhotoIcon },
];

export default function AdminLayout({ children, activeTab, onTabChange }) {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <GlassCard className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Kelola sistem komunitas komentar</p>
        </GlassCard>

        {/* Navigation Tabs */}
        <GlassCard className="p-1">
          <div className="grid grid-cols-4 gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`flex items-center justify-center space-x-2 py-3 px-2 rounded-xl font-medium text-sm ${
                    activeTab === tab.key
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-white/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:block">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Content */}
        <GlassCard>
          {children}
        </GlassCard>
      </div>
    </div>
  );
}
