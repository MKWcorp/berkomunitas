'use client';
import { useRef } from 'react';
import { CameraIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import GlassCard from '../../components/GlassCard';
import ProfileNameEditor from './ProfileNameEditor';
import { getDisplayPrivileges } from '../../../utils/privilegeChecker';

export default function ProfileSection({ 
  member, 
  profilePictureUrl, 
  level, 
  privileges,
  uploading, 
  onFileChange, 
  fileInputRef 
}) {
  const router = useRouter();
  const displayImageUrl = profilePictureUrl || member?.foto_profil_url;

  // Get user's highest privilege (not just first one)
  const getHighestPrivilege = (privileges) => {
    if (!privileges || privileges.length === 0) return 'user';
    
    const privilegeHierarchy = { 'user': 1, 'berkomunitasplus': 2, 'partner': 3, 'admin': 4 };
    let highest = 'user';
    let highestLevel = 0;
    
    privileges.forEach(p => {
      const level = privilegeHierarchy[p.privilege] || 0;
      if (level > highestLevel) {
        highest = p.privilege;
        highestLevel = level;
      }
    });
    
    return highest;
  };
  
  const userCurrentPrivilege = getHighestPrivilege(privileges);
  
  // Get all privileges that should be displayed (all hierarchical levels)
  const displayPrivileges = getDisplayPrivileges(userCurrentPrivilege);

  // Function to get privilege label and styling
  const getPrivilegeInfo = (privilege) => {
    switch (privilege.toLowerCase()) {
      case 'admin':
        return {
          label: 'Admin',
          bgClass: 'from-red-500 to-red-600',
          textClass: 'text-white',
          icon: '👑'
        };
      case 'partner':
        return {
          label: 'Partner',
          bgClass: 'from-purple-500 to-purple-600',
          textClass: 'text-white',
          icon: '🤝'
        };
      case 'berkomunitasplus':
        return {
          label: 'BerkomunitasPlus',
          bgClass: 'from-yellow-400 via-amber-500 to-yellow-600',
          textClass: 'text-white',
          icon: '⭐'
        };
      case 'user':
        return {
          label: 'Member',
          bgClass: 'from-blue-500 to-blue-600',
          textClass: 'text-white',
          icon: '👤'
        };
      case 'moderator':
        return {
          label: 'Moderator',
          bgClass: 'from-green-500 to-green-600',
          textClass: 'text-white',
          icon: '⚡'
        };
      case 'vip':
        return {
          label: 'VIP',
          bgClass: 'from-yellow-500 to-yellow-600',
          textClass: 'text-white',
          icon: '⭐'
        };
      default:
        return {
          label: privilege.charAt(0).toUpperCase() + privilege.slice(1),
          bgClass: 'from-gray-500 to-gray-600',
          textClass: 'text-white',
          icon: '🏷️'
        };
    }
  };

  return (
    <GlassCard variant="default" padding="lg" className="mb-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
        {/* Profile Picture */}
        <div className="relative group">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-white/30 shadow-xl">
            {displayImageUrl ? (
              <img
                src={displayImageUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-2xl sm:text-3xl font-bold">
                  {member?.nama_lengkap?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>

          {/* Photo Upload Overlay */}
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <button
              onClick={() => fileInputRef?.current?.click()}
              disabled={uploading}
              className="text-white hover:text-gray-200 transition-colors p-2 rounded-full bg-white/20 backdrop-blur-sm"
              title="Upload foto profil"
            >
              <CameraIcon className="h-5 w-5" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
        </div>

        {/* Profile Info */}
        <div className="flex-1 text-center sm:text-left">
          {/* Profile Name Editor with Clerk integration */}
          <div className="mb-4">
            <ProfileNameEditor />
          </div>

          {/* Level & Privilege Labels */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-3 mb-4">
            <div className="inline-flex items-center px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium shadow-lg">
              <span>Level {level.current?.level_number || 1}</span>
            </div>
            
            {/* Privilege Labels - Show hierarchical privileges */}
            {displayPrivileges && displayPrivileges.length > 0 && displayPrivileges.map((privilegeName, index) => {
              const privilegeInfo = getPrivilegeInfo(privilegeName);
              return (
                <div 
                  key={index}
                  className={`inline-flex items-center px-3 py-1.5 rounded-xl bg-gradient-to-r ${privilegeInfo.bgClass} ${privilegeInfo.textClass} text-sm font-medium shadow-lg transform hover:scale-105 transition-all duration-200`}
                  title={`Privilege: ${privilegeInfo.label}`}
                >
                  <span className="mr-1">{privilegeInfo.icon}</span>
                  <span>{privilegeInfo.label}</span>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          {level.next && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-600">Progress ke {level.next.level_name}</span>
                <span className="text-xs text-gray-600">{Math.round(level.progressPercent)}%</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2 backdrop-blur-sm">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(level.progressPercent, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
