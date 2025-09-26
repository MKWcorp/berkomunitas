'use client';
import { CameraIcon } from '@heroicons/react/24/outline';
import GlassCard from '../../components/GlassCard';

export default function ProfileHeader({ member, level, profilePictureUrl, onPhotoUpload, uploading }) {
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onPhotoUpload(file);
    }
  };

  return (
    <GlassCard className="text-center">
      <div className="flex flex-col items-center space-y-4">
        {/* Profile Picture */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/50 shadow-lg">
            <img
              src={profilePictureUrl || '/placeholder-avatar.png'}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <label className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 cursor-pointer transition-colors duration-300 shadow-lg">
            <CameraIcon className="w-4 h-4" />
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={uploading}
            />
          </label>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-800">
            {member?.display_name || 'Nama Belum Diatur'}
          </h1>
          <p className="text-gray-600">@{member?.username}</p>
          {member?.bio && (
            <p className="text-gray-600 max-w-md mx-auto">{member.bio}</p>
          )}
        </div>

        {/* Level & Points */}
        <div className="bg-gradient-to-r from-blue-100/80 to-purple-100/80 rounded-2xl p-4 border border-blue-400">
          <div className="flex items-center justify-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{level.current.level_number}</div>
              <div className="text-sm text-gray-700">Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{member?.loyalty_points || 0}</div>
              <div className="text-sm text-gray-700">Poin</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{level.progressPercent}%</div>
              <div className="text-sm text-gray-700">Progress</div>
            </div>
          </div>
          
          {level.next && (
            <div className="mt-3">
              <div className="text-sm text-gray-700 mb-1">
                Menuju {level.next.level_name}
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${level.progressPercent}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {level.pointsToNextLevel} poin lagi untuk naik level
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
