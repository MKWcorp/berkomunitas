'use client';

import { useSSOUser } from '@/hooks/useSSOUser';

export default function ProfileNameEditor() {
  const { user } = useSSOUser();

  // Get the display name from user data
  const displayName = user?.username || user?.email?.split('@')[0] || 'Nama Lengkap';

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          {displayName}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Nama lengkap dari profil Anda
        </p>
      </div>
    </div>
  );
}
