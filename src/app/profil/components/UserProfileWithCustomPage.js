'use client';

import { useSSOUser } from '@/hooks/useSSOUser';
import EmailSocialManager from './EmailSocialManager';

export default function UserProfileWithCustomPage() {
  const { user } = useSSOUser();

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Please sign in to manage your profile</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Email & Social Media Management</h2>
      <p className="text-gray-600 mb-6">
        Kelola alamat email dan koneksi social media Anda di sini. Anda dapat menambah email baru dan menghubungkan akun Facebook.
      </p>
      <EmailSocialManager />
    </div>
  );
}
