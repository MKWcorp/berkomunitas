'use client';
import React, { useState, useEffect } from 'react';
import { 
  GlobeAltIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  UserIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faInstagram,
  faTiktok,
  faFacebook,
  faTwitter,
  faYoutube,
  faLinkedin
} from '@fortawesome/free-brands-svg-icons';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import AdminModal from '../components/AdminModal';

// Platform icons mapping
const PLATFORM_ICONS = {
  instagram: faInstagram,
  tiktok: faTiktok,
  facebook: faFacebook,
  twitter: faTwitter,
  youtube: faYoutube,
  linkedin: faLinkedin,
  other: faGlobe
};

// Platform colors for badges
const PLATFORM_COLORS = {
  instagram: 'bg-pink-100 text-pink-800',
  tiktok: 'bg-gray-100 text-gray-800',
  facebook: 'bg-blue-100 text-blue-800',
  twitter: 'bg-sky-100 text-sky-800',
  youtube: 'bg-red-100 text-red-800',
  linkedin: 'bg-blue-100 text-blue-800',
  other: 'bg-gray-100 text-gray-800'
};

// Helper function to get platform icon color
const getPlatformIconColor = (platform) => {
  const colorMap = {
    instagram: 'text-pink-500',
    tiktok: 'text-gray-800',
    youtube: 'text-red-500',
    twitter: 'text-blue-500',
    facebook: 'text-blue-600',
    linkedin: 'text-blue-700',
    other: 'text-gray-500'
  };
  return colorMap[platform] || colorMap.other;
};

// Modal untuk edit/tambah sosial media
function SocialMediaModal({ isOpen, onClose, socialMedia, onSave, members, platforms, position }) {
  const [formData, setFormData] = useState({
    id_member: '',
    platform: '',
    username_sosmed: '',
    profile_link: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showCustomPlatform, setShowCustomPlatform] = useState(false);
  const [customPlatform, setCustomPlatform] = useState('');

  useEffect(() => {
    if (socialMedia) {
      setFormData({
        id_member: socialMedia.id_member,
        platform: socialMedia.platform,
        username_sosmed: socialMedia.username_sosmed,
        profile_link: socialMedia.profile_link || ''
      });
      setShowCustomPlatform(false);
      setCustomPlatform('');
    } else {
      setFormData({
        id_member: '',
        platform: '',
        username_sosmed: '',
        profile_link: ''
      });
      setShowCustomPlatform(false);
      setCustomPlatform('');
    }
    setError('');
  }, [socialMedia, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Validate platform selection
      if (!formData.platform && !showCustomPlatform) {
        setError('Silakan pilih platform');
        setSaving(false);
        return;
      }

      if (showCustomPlatform && !customPlatform.trim()) {
        setError('Silakan masukkan nama platform custom');
        setSaving(false);
        return;
      }

      // Use custom platform if specified
      const finalFormData = {
        ...formData,
        platform: showCustomPlatform && customPlatform ? customPlatform.toLowerCase().trim() : formData.platform
      };

      const url = socialMedia 
        ? `/api/admin/social-media/${socialMedia.id}`
        : '/api/admin/social-media';
      
      const method = socialMedia ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalFormData),
      });

      const result = await response.json();
      
      if (response.ok) {
        await onSave();
        onClose();
      } else {
        setError(result.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      setError('Terjadi kesalahan saat menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset custom platform jika pilih dari dropdown
    if (name === 'platform' && value !== 'custom') {
      setShowCustomPlatform(false);
      setCustomPlatform('');
    } else if (name === 'platform' && value === 'custom') {
      setShowCustomPlatform(true);
    }
  };

  if (!isOpen) return null;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Profil Sosial Media"
      maxWidth="max-w-md"
      position={position}
    >
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Member <span className="text-red-500">*</span>
          </label>
          <select
            name="id_member"
            value={formData.id_member}
            onChange={handleInputChange}
            required
            disabled={!!socialMedia}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="">Pilih Member</option>
            {members.map(member => (
              <option key={member.id} value={member.id}>
                {member.nama_lengkap} (ID: {member.id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Platform <span className="text-red-500">*</span>
          </label>
          <select
            name="platform"
            value={formData.platform}
            onChange={handleInputChange}
            required={!showCustomPlatform}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Pilih Platform</option>
            {platforms.map(platform => (
              <option key={platform} value={platform} className="capitalize">
                {platform}
              </option>
            ))}
            <option value="custom">+ Platform Lain (Custom)</option>
          </select>
          
          {/* Custom Platform Input */}
          {showCustomPlatform && (
            <div className="mt-2">
              <input
                type="text"
                value={customPlatform}
                onChange={(e) => setCustomPlatform(e.target.value)}
                placeholder="Masukkan nama platform (contoh: threads, discord)"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Platform akan disimpan dalam huruf kecil
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username/Handle <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="username_sosmed"
            value={formData.username_sosmed}
            onChange={handleInputChange}
            required
            placeholder="contoh: johndoe"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Link Profil
          </label>
          <input
            type="url"
            name="profile_link"
            value={formData.profile_link}
            onChange={handleInputChange}
            placeholder="https://..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}

export default function SocialMediaTab() {
  const [socialMediaData, setSocialMediaData] = useState([]);
  const [members, setMembers] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSocialMedia, setSelectedSocialMedia] = useState(null);
  const [modalPosition, setModalPosition] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch social media data (now includes all members)
      const socialResponse = await fetch('/api/admin/social-media');

      if (socialResponse.ok) {
        const socialData = await socialResponse.json();
        setSocialMediaData(socialData.members || []); // Now contains all members
        setMembers(socialData.members || []); // Same data for modal dropdown
        setPlatforms(socialData.platforms || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (socialMedia, event) => {
    // Capture click position
    if (event) {
      setModalPosition({
        top: event.clientY,
        left: event.clientX
      });
    } else {
      setModalPosition(null);
    }
    
    // Convert the social media profile to expected format for modal
    const formattedSocialMedia = {
      ...socialMedia,
      id_member: socialMedia.memberId || socialMedia.id_member
    };
    setSelectedSocialMedia(formattedSocialMedia);
    setModalOpen(true);
  };

  const handleAdd = (event) => {
    // Capture click position
    if (event) {
      setModalPosition({
        top: event.clientY,
        left: event.clientX
      });
    } else {
      setModalPosition(null);
    }
    
    setSelectedSocialMedia(null);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus profil sosial media ini?')) return;

    try {
      const response = await fetch(`/api/admin/social-media/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
      } else {
        const result = await response.json();
        alert(result.error || 'Gagal menghapus data');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Terjadi kesalahan saat menghapus data');
    }
  };

  // Filter data - now filtering members instead of individual social media profiles
  const filteredData = socialMediaData.filter(member => {
    const matchesSearch = 
      member.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.profil_sosial_media?.some(profile => 
        profile.username_sosmed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.platform?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesPlatform = !selectedPlatform || 
      member.profil_sosial_media?.some(profile => profile.platform === selectedPlatform);
    
    return matchesSearch && matchesPlatform;
  });

  // Sort filtered members by name
  const sortedMembers = filteredData.sort((a, b) => 
    (a.nama_lengkap || '').localeCompare(b.nama_lengkap || '')
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <GlobeAltIcon className="w-8 h-8 text-blue-600" />
            Kelola Profil Sosial Media
          </h2>
          <p className="text-gray-600 mt-1">
            Kelola akun sosial media yang dimiliki oleh members
          </p>
        </div>
        <button
          onClick={(e) => handleAdd(e)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Tambah Profil Sosial Media
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Member</p>
              <p className="text-2xl font-bold text-gray-900">{socialMediaData.length}</p>
            </div>
            <UserIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Punya Sosial Media</p>
              <p className="text-2xl font-bold text-green-600">
                {socialMediaData.filter(member => member.has_social_media).length}
              </p>
            </div>
            <GlobeAltIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Belum Ada Sosial Media</p>
              <p className="text-2xl font-bold text-red-600">
                {socialMediaData.filter(member => !member.has_social_media).length}
              </p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Platform Tersedia</p>
              <p className="text-2xl font-bold text-gray-900">{platforms.length}</p>
            </div>
            <LinkIcon className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari member atau username sosial media..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Platform</option>
              {platforms.map(platform => (
                <option key={platform} value={platform} className="capitalize">
                  {platform}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Informasi Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform Sosial Media
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedMembers.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || selectedPlatform ? 'Tidak ada data yang sesuai dengan filter' : 'Belum ada member'}
                  </td>
                </tr>
              ) : (
                sortedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    {/* Member Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {member.foto_profil_url ? (
                            <img
                              className="h-12 w-12 rounded-full object-cover"
                              src={member.foto_profil_url}
                              alt=""
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                              <UserIcon className="w-7 h-7 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-base font-medium text-gray-900">
                            {member.nama_lengkap || 'Nama tidak diset'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {member.id} • {member.email}
                          </div>
                          <div className="text-xs text-gray-400">
                            Terdaftar: {new Date(member.tanggal_daftar).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Social Media Status & Platforms */}
                    <td className="px-6 py-4">
                      {member.has_social_media ? (
                        <div className="space-y-2">
                          {member.profil_sosial_media.map((profile) => (
                            <div 
                              key={profile.id} 
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2">
                                  <FontAwesomeIcon
                                    icon={PLATFORM_ICONS[profile.platform] || PLATFORM_ICONS.other}
                                    className={`w-5 h-5 ${getPlatformIconColor(profile.platform)}`}
                                  />
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${PLATFORM_COLORS[profile.platform] || PLATFORM_COLORS.other}`}>
                                    <span className="capitalize">{profile.platform}</span>
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    @{profile.username_sosmed}
                                  </div>
                                  {profile.profile_link && (
                                    <a
                                      href={profile.profile_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:text-blue-500 flex items-center gap-1"
                                    >
                                      <LinkIcon className="w-3 h-3" />
                                      Lihat Profil
                                    </a>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={(e) => handleEdit({...profile, memberId: member.id}, e)}
                                  className="text-blue-600 hover:text-blue-500 p-1 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(profile.id)}
                                  className="text-red-600 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-colors"
                                  title="Hapus"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <div className="inline-flex items-center px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium">
                            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                            Belum ada sosial media
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={(e) => handleAdd(e)}
                        className="text-green-600 hover:text-green-500 p-2 hover:bg-green-50 rounded-lg transition-colors"
                        title="Tambah Platform"
                      >
                        <PlusIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 text-sm text-gray-600">
        Menampilkan {sortedMembers.length} member dari total {socialMediaData.length} member. 
        {' '}
        {socialMediaData.filter(m => m.has_social_media).length} member memiliki sosial media, 
        {' '}
        {socialMediaData.filter(m => !m.has_social_media).length} member belum memiliki sosial media.
      </div>

      {/* Modal */}
      <SocialMediaModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedSocialMedia(null);
          setModalPosition(null);
        }}
        socialMedia={selectedSocialMedia}
        onSave={fetchData}
        members={members}
        platforms={platforms}
        position={modalPosition}
      />
    </div>
  );
}
