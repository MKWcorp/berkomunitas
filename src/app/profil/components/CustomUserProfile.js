'use client';

import { useSSOUser } from '@/hooks/useSSOUser';
import EmailSocialManager from './EmailSocialManager';

export default function CustomUserProfile() {
  const { user } = useSSOUser();

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Please sign in to manage your profile</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Email & Social Media</h2>
      <EmailSocialManager />
    </div>
  );
}
