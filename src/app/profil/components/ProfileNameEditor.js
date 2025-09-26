'use client';

import { useUser } from '@clerk/nextjs';

export default function ProfileNameEditor() {
  const { user } = useUser();

  // Get the display name from user data
  const displayName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Nama Lengkap';

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
