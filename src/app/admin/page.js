'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { ExclamationTriangleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import AdminLayout from './components/AdminLayout';
import { GlassCard } from '@/components/GlassLayout';
import DashboardTab from './tabs/DashboardTab';
import RewardsTab from './tabs/RewardsTab';
import BadgesTab from './tabs/BadgesTab';
import LevelsTab from './tabs/LevelsTab';
import TasksTab from './tabs/TasksTab';
import PrivilegesTab from './tabs/PrivilegesTab';
import PointsTab from './tabs/PointsTab';
import CrudTab from './tabs/CrudTab';
import MembersTab from './tabs/MembersTab';
import FixEmailsTab from './tabs/FixEmailsTab';
import GeneratePhotosTab from './tabs/GeneratePhotosTab';
import SocialMediaTab from './tabs/SocialMediaTab';

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(null);
  const [tab, setTab] = useState('dashboard');

  useEffect(() => {
    if (!isLoaded) return;
    if (!user?.primaryEmailAddress?.emailAddress) {
      setIsAdmin(false);
      return;
    }
    fetch('/api/admin/privileges', {
      headers: { 'x-user-email': user.primaryEmailAddress.emailAddress }
    })
    .then(res => res.json())
    .then(data => setIsAdmin(data.isAdmin))
    .catch(() => setIsAdmin(false));
  }, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Memuat...</div>
        </GlassCard>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="text-center">
          <LockClosedIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>
          <p className="text-gray-600">Silakan login terlebih dahulu.</p>
        </GlassCard>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Akses Ditolak</h1>
          <p className="text-gray-600">Anda tidak memiliki akses ke halaman admin.</p>
        </GlassCard>
      </div>
    );
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Memeriksa hak akses...</div>
        </GlassCard>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (tab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'rewards':
        return <RewardsTab />;
      case 'badges':
        return <BadgesTab />;
      case 'levels':
        return <LevelsTab />;
      case 'tugas':
        return <TasksTab />;
      case 'privileges':
        return <PrivilegesTab />;      case 'points':
        return <PointsTab />;
      case 'members':
        return <MembersTab />;      case 'social-media':
        return <SocialMediaTab />;
      case 'generate-photos':
        return <GeneratePhotosTab />;
      case 'fix-emails':
        return <FixEmailsTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <AdminLayout activeTab={tab} onTabChange={setTab}>
      {renderTabContent()}
    </AdminLayout>
  );
}
