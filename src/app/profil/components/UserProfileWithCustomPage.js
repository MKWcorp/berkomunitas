'use client';

import { UserButton } from '@clerk/nextjs';
import EmailSocialManager from './EmailSocialManager';

export default function UserProfileWithCustomPage() {
  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: "w-10 h-10",
          userButtonPopoverCard: "shadow-lg"
        }
      }}
    >
      {/* Add custom page to UserButton dropdown */}
      <UserButton.UserProfilePage 
        label="Email & Social" 
        labelIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        }
        url="email-social"
      >
        <div className="p-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Email & Social Media Management</h2>
          <p className="text-gray-600 mb-6">
            Kelola alamat email dan koneksi social media Anda di sini. Anda dapat menambah email baru dan menghubungkan akun Facebook.
          </p>
          <EmailSocialManager />
        </div>
      </UserButton.UserProfilePage>
      
      {/* Add custom link in the UserButton menu */}
      <UserButton.UserProfileLink 
        label="Kustomisasi Profil"
        labelIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
        url="/profil"
      />
    </UserButton>
  );
}
