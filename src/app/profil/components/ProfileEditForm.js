'use client';
import { useState } from 'react';
import { DocumentTextIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import GlassCard from '../../components/GlassCard';

export default function ProfileEditForm({ 
  member, 
  socialProfiles, 
  onSave, 
  saving = false,
  message = '' 
}) {
  const [formData, setFormData] = useState({
    display_name: member?.display_name || '',
    bio: member?.bio || '',
    phone: member?.phone || '',
    address: member?.address || '',
    birth_date: member?.birth_date ? new Date(member.birth_date).toISOString().split('T')[0] : '',
    gender: member?.gender || '',
    social_media: {
      instagram: socialProfiles.find(p => p.platform === 'instagram')?.profile_url || '',
      twitter: socialProfiles.find(p => p.platform === 'twitter')?.profile_url || '',
      facebook: socialProfiles.find(p => p.platform === 'facebook')?.profile_url || '',
      tiktok: socialProfiles.find(p => p.platform === 'tiktok')?.profile_url || '',
      youtube: socialProfiles.find(p => p.platform === 'youtube')?.profile_url || '',
      linkedin: socialProfiles.find(p => p.platform === 'linkedin')?.profile_url || '',
    }
  });

  const handleInputChange = (field, value) => {
    if (field.startsWith('social_media.')) {
      const platform = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        social_media: {
          ...prev.social_media,
          [platform]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <GlassCard className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            Informasi Dasar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Nama Tampilan <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                className="w-full px-4 py-3 bg-white/70 border border-gray-400 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Masukkan nama tampilan"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Nomor Telepon
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-4 py-3 bg-white/70 border border-gray-400 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Tanggal Lahir
              </label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleInputChange('birth_date', e.target.value)}
                className="w-full px-4 py-3 bg-white/70 border border-gray-400 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Jenis Kelamin
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full px-4 py-3 bg-white/70 border border-gray-400 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              >
                <option value="">Pilih jenis kelamin</option>
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Bio/Deskripsi
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-white/70 border border-gray-400 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
              placeholder="Ceritakan tentang diri Anda..."
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Alamat
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white/70 border border-gray-400 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
              placeholder="Masukkan alamat lengkap"
            />
          </div>
        </div>

        {/* Social Media Section */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <GlobeAltIcon className="h-6 w-6 text-green-600" />
            Media Sosial
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(formData.social_media).map(([platform, url]) => (
              <div key={platform}>
                <label className="block text-sm font-medium text-gray-800 mb-2 capitalize">
                  {platform}
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleInputChange(`social_media.${platform}`, e.target.value)}
                  className="w-full px-4 py-3 bg-white/70 border border-gray-400 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder={`https://${platform}.com/username`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex flex-col items-center space-y-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Menyimpan...' : 'Simpan Profil Lengkap'}
          </button>
          <p className="text-sm text-gray-600 text-center mt-2">
            Simpan untuk menyelesaikan semua perubahan profil Anda
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl ${message.includes('berhasil') ? 'bg-green-100/80 text-green-800 border border-green-400' : 'bg-red-100/80 text-red-800 border border-red-400'}`}>
            {message}
          </div>
        )}
      </form>
    </GlassCard>
  );
}
