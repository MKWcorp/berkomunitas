'use client';

import { useState } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import SetPasswordForm from './components/SetPasswordForm';
import ActiveDevicesManager from './components/ActiveDevicesManager';
import DeleteAccountSection from './components/DeleteAccountSection';
import { 
  ShieldCheckIcon, 
  KeyIcon,
  DevicePhoneMobileIcon,
  TrashIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

export default function SecurityPage() {
  const { user, isLoaded } = useSSOUser();
  const [activeTab, setActiveTab] = useState('password');

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You need to be logged in to access security settings.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'password',
      name: 'Password',
      icon: KeyIcon,
      description: 'Atur atau ganti password akun Anda'
    },
    {
      id: 'devices',
      name: 'Perangkat Aktif',
      icon: DevicePhoneMobileIcon,
      description: 'Kelola perangkat yang sedang login'
    },
    {
      id: 'delete',
      name: 'Hapus Akun',
      icon: TrashIcon,
      description: 'Hapus akun secara permanen'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
              <ShieldCheckIcon className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Keamanan Akun
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Kelola pengaturan keamanan akun Anda untuk menjaga informasi pribadi tetap aman
          </p>
        </div>

        {/* Security Overview */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShieldCheckIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Status Keamanan</h2>
                <p className="text-gray-600">Informasi keamanan akun Anda</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Account Type */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Tipe Akun</h3>
                <p className="text-sm text-gray-600">
                  {user.hasVerifiedEmailAddress ? '✅ Email Terverifikasi' : '⚠️ Email Belum Terverifikasi'}
                </p>
              </div>

              {/* Password Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Status Password</h3>
                <p className="text-sm text-gray-600">
                  {user.passwordEnabled ? '✅ Password Aktif' : '⚠️ Belum Ada Password'}
                </p>
              </div>

              {/* Two-Factor */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Keamanan Berlapis</h3>
                <p className="text-sm text-gray-600">
                  {user.twoFactorEnabled ? '✅ 2FA Aktif' : '❌ 2FA Tidak Aktif'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } ${tab.id === 'delete' ? 'hover:text-red-600 hover:border-red-300' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <IconComponent className={`w-5 h-5 ${tab.id === 'delete' && activeTab === tab.id ? 'text-red-600' : ''}`} />
                        <span className={tab.id === 'delete' && activeTab === tab.id ? 'text-red-600' : ''}>{tab.name}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'password' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Atur/Ganti Password
                    </h3>
                    <p className="text-gray-600">
                      {user.passwordEnabled 
                        ? 'Ganti password Anda untuk menjaga keamanan akun' 
                        : 'Buat password untuk mengamankan akun Anda'
                      }
                    </p>
                  </div>
                  
                  <SetPasswordForm />
                </div>
              )}

              {activeTab === 'devices' && (
                <div>
                  <ActiveDevicesManager />
                </div>
              )}

              {activeTab === 'delete' && (
                <div>
                  <DeleteAccountSection />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Tips */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
              Tips Keamanan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Password yang Kuat:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Minimal 8 karakter</li>
                  <li>• Kombinasi huruf besar dan kecil</li>
                  <li>• Sertakan angka dan simbol</li>
                  <li>• Hindari informasi pribadi</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Praktik Keamanan:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Jangan gunakan password yang sama</li>
                  <li>• Aktifkan 2FA jika tersedia</li>
                  <li>• Update password secara berkala</li>
                  <li>• Logout dari perangkat umum</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
