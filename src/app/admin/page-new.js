'use client';
import { useState, useEffect } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import AdminLayout from './components/AdminLayout';
import DashboardTab from './tabs/DashboardTab';
import CrudTab from './tabs/CrudTab';

export default function AdminPage() {
  const { user, isLoaded } = useSSOUser();
  const [isAdmin, setIsAdmin] = useState(null);
  const [tab, setTab] = useState('dashboard');

  useEffect(() => {
    if (!isLoaded) return;
    if (!user?.email) {
      setIsAdmin(false);
      return;
    }
    fetch('/api/admin/privileges', {
      headers: { 'x-user-email': user.email }
    })
    .then(res => res.json())
    .then(data => setIsAdmin(data.isAdmin))
    .catch(() => setIsAdmin(false));
  }, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
          <p className="text-gray-600">Silakan login terlebih dahulu.</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Akses Ditolak</h1>
          <p className="text-gray-600">Anda tidak memiliki akses ke halaman admin.</p>
        </div>
      </div>
    );
  }

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Memeriksa hak akses...</div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (tab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'rewards':
        return <CrudTab resource="rewards" />;
      case 'badges':
        return <CrudTab resource="badges" />;
      case 'levels':
        return <CrudTab resource="levels" />;
      case 'tugas':
        return <CrudTab resource="tugas" />;
      case 'privileges':
        return <CrudTab resource="privileges" />;
      case 'points':
        return <CrudTab resource="points" />;
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
