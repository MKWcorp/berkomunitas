'use client';

import { UserProfile } from '@clerk/nextjs';
import EmailSocialManager from './EmailSocialManager';

export default function CustomUserProfile() {
  return (
    <UserProfile>
      {/* Custom page for Email & Social Management */}
      <UserProfile.Page 
        label="Email & Social" 
        labelIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        }
        url="email-social"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Email & Social Media</h2>
          <EmailSocialManager />
        </div>
      </UserProfile.Page>
    </UserProfile>
  );
}
