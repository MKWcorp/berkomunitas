'use client';
import { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CameraIcon,
  BookmarkIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
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
import GlassCard from '../../components/GlassCard';

export default function EditProfileTab({ member, socialProfiles, message, setMessage }) {
  const [formData, setFormData] = useState({
    nama_lengkap: member?.nama_lengkap || '',
    username: '',
    nomer_wa: member?.nomer_wa || '',
  });
  const [saving, setSaving] = useState(false);
  const [socialProfiles2, setSocialProfiles] = useState(socialProfiles || []);
  const [duplicateDialogData, setDuplicateDialogData] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  
  // All social media profiles (for display and management)
  const [allSocialProfiles, setAllSocialProfiles] = useState([]);
  
  // New social media entry
  const [newSocialMedia, setNewSocialMedia] = useState({
    platform: 'instagram',
    username: ''
  });
  
  // Username availability check
  const [usernameCheckStatus, setUsernameCheckStatus] = useState({
    isChecking: false,
    isAvailable: null,
    message: ''
  });
  
  // Email from user account
  const [userEmail, setUserEmail] = useState('');
  
  // Username loading state
  const [usernameLoading, setUsernameLoading] = useState(true);

  // Fetch username data on mount and update form
  useEffect(() => {
    fetchUsernameData();
    fetchUserEmail();
    fetchSocialMediaProfiles();
  }, []);

  const fetchSocialMediaProfiles = async () => {
    try {
      const response = await fetch('/api/profil/sosial-media');
      const data = await response.json();
      
      if (response.ok && data.profiles) {
        setAllSocialProfiles(data.profiles);
        setSocialProfiles(data.profiles); // Keep compatibility
      }
    } catch (error) {
      console.error('Error fetching social media profiles:', error);
    }
  };

  const fetchUserEmail = async () => {
    try {
      const response = await fetch('/api/profil/email');
      const data = await response.json();
      
      if (response.ok && data.email) {
        setUserEmail(data.email);
      }
    } catch (error) {
      console.error('Error fetching user email:', error);
    }
  };

  // Update form data when member prop changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      nama_lengkap: member?.nama_lengkap || '',
      nomer_wa: member?.nomer_wa || '',
    }));
  }, [member]);

  // Update social profiles when prop changes
  useEffect(() => {
    setSocialProfiles(socialProfiles || []);
  }, [socialProfiles]);

  const fetchUsernameData = async () => {
    try {
      const response = await fetch('/api/profil/username');
      const data = await response.json();
      
      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          username: data.username || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching username data:', error);
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleNewSocialMediaChange = (field, value) => {
    setNewSocialMedia(prev => ({
      ...prev,
      [field]: value
    }));

    // Reset check status when field changes
    if (field === 'username' || field === 'platform') {
      setUsernameCheckStatus({
        isChecking: false,
        isAvailable: null,
        message: ''
      });

      // Trigger check if username has value and is valid
      if (field === 'username' && value.trim()) {
        checkUsernameAvailability(newSocialMedia.platform, value.trim());
      } else if (field === 'platform' && newSocialMedia.username.trim()) {
        checkUsernameAvailability(value, newSocialMedia.username.trim());
      }
    }
  };

  const checkUsernameAvailability = async (platform, username) => {
    if (!username || username.length < 3) {
      setUsernameCheckStatus({
        isChecking: false,
        isAvailable: false,
        message: 'Username minimal 3 karakter'
      });
      return;
    }

    setUsernameCheckStatus({
      isChecking: true,
      isAvailable: null,
      message: 'Mengecek ketersediaan...'
    });

    try {
      const response = await fetch('/api/profil/sosial-media/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, username }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        setUsernameCheckStatus({
          isChecking: false,
          isAvailable: data.available,
          message: data.message
        });
      } else {
        setUsernameCheckStatus({
          isChecking: false,
          isAvailable: false,
          message: data.error || 'Error checking availability'
        });
      }
    } catch (error) {
      setUsernameCheckStatus({
        isChecking: false,
        isAvailable: false,
        message: 'Error checking availability'
      });
    }
  };

  const addNewSocialMedia = async () => {
    if (!newSocialMedia.username.trim()) {
      setMessage('Username tidak boleh kosong');
      return;
    }

    // Check if username is available before submitting
    if (!usernameCheckStatus.isAvailable) {
      setMessage('Username tidak tersedia atau belum dicek. Silakan pilih username lain.');
      return;
    }

    try {
      const platformData = {
        instagram: { prefix: 'https://www.instagram.com/', name: 'instagram' },
        tiktok: { prefix: 'https://www.tiktok.com/@', name: 'tiktok' },
        facebook: { prefix: 'https://www.facebook.com/', name: 'facebook' }
      };

      const platform = platformData[newSocialMedia.platform];
      const url = platform.prefix + newSocialMedia.username.trim();

      const response = await fetch('/api/profil/sosial-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url,
          platform: platform.name,
          username: newSocialMedia.username.trim()
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAllSocialProfiles(prev => [...prev, data.profile]);
        setNewSocialMedia({ platform: 'instagram', username: '' });
        setUsernameCheckStatus({
          isChecking: false,
          isAvailable: null,
          message: ''
        });
        setMessage('Akun media sosial berhasil ditambahkan!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menambah akun media sosial');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  const deleteSocialMedia = async (profileId) => {
    try {
      const response = await fetch('/api/profil/sosial-media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: profileId }),
        credentials: 'include'
      });

      if (response.ok) {
        setAllSocialProfiles(prev => prev.filter(p => p.id !== profileId));
        setMessage('Akun media sosial berhasil dihapus');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus akun media sosial');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    // Validate required fields
    if (!formData.nama_lengkap.trim()) {
      errors.nama_lengkap = 'Nama lengkap wajib diisi';
    }
    
    if (!formData.username.trim()) {
      errors.username = 'Username wajib diisi';
    } else if (formData.username.includes(' ')) {
      errors.username = 'Username tidak boleh mengandung spasi';
    } else if (formData.username.length < 3) {
      errors.username = 'Username minimal 3 karakter';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      errors.username = 'Username hanya boleh berisi huruf, angka, underscore, dan dash';
    }
    
    if (!formData.nomer_wa.trim()) {
      errors.nomer_wa = 'Nomor WhatsApp wajib diisi';
    }
    
    // Check if at least one social media account is added
    if (allSocialProfiles.length === 0) {
      errors.social_media = 'Minimal satu akun media sosial wajib diisi';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage('Harap periksa kembali data yang Anda masukkan');
      return;
    }

    setSaving(true);
    setFieldErrors({});

    try {
      // Update profile data
      const profileResponse = await fetch('/api/profil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: formData.nama_lengkap,
          nomer_wa: formData.nomer_wa
        }),
        credentials: 'include'
      });

      if (!profileResponse.ok) {
        const profileData = await profileResponse.json();
        throw new Error(profileData.error || 'Gagal memperbarui profil');
      }

      // Update username
      const usernameResponse = await fetch('/api/profil/username', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username }),
        credentials: 'include'
      });

      if (!usernameResponse.ok) {
        const usernameData = await usernameResponse.json();
        throw new Error(usernameData.error || 'Gagal memperbarui username');
      }

      setMessage('Profil berhasil diperbarui!');
      
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSocialMedia = async () => {
    if (!tempSocialLink.trim()) return;

    try {
      const response = await fetch('/api/profil/sosial-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: tempSocialLink.trim() }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setSocialProfiles(prev => [...prev, data.profile]);
        setTempSocialLink('');
        // Clear social media error if exists
        if (fieldErrors.social_media) {
          setFieldErrors(prev => ({ ...prev, social_media: null }));
        }
      } else if (response.status === 409 && data.duplicates) {
        setDuplicateDialogData({
          duplicates: data.duplicates,
          newProfile: data.newProfile,
          onResolve: async (action) => {
            const resolveResponse = await fetch('/api/profil/sosial-media/resolve-duplicate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                url: tempSocialLink.trim(), 
                action,
                duplicateIds: data.duplicates.map(d => d.id)
              }),
              credentials: 'include'
            });

            const resolveData = await resolveResponse.json();
            if (resolveResponse.ok) {
              setSocialProfiles(resolveData.profiles);
              setTempSocialLink('');
              if (fieldErrors.social_media) {
                setFieldErrors(prev => ({ ...prev, social_media: null }));
              }
            }
            setDuplicateDialogData(null);
          }
        });
      } else {
        throw new Error(data.error || 'Gagal menambahkan profil sosial media');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  const handleDeleteSocialMedia = async (profileId, retryCount = 0) => {
    const maxRetries = 2;
    
    try {
      const response = await fetch(`/api/profil/sosial-media/${profileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        // Try to parse JSON response if available
        let result = {};
        try {
          result = await response.json();
        } catch (jsonError) {
          // Response might be empty, which is fine for successful deletion
          console.log('No JSON response from server, but deletion was successful');
        }
        
        setSocialProfiles(prev => prev.filter(p => p.id !== profileId));
        setAllSocialProfiles(prev => prev.filter(p => p.id !== profileId));
        setMessage(result.message || 'Akun media sosial berhasil dihapus');
        
      } else if (response.status === 503 && retryCount < maxRetries) {
        // Service Unavailable - database connection issue, retry
        console.log(`Database connection error, retrying... (attempt ${retryCount + 1}/${maxRetries})`);
        setMessage('Koneksi database bermasalah, mencoba lagi...');
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return handleDeleteSocialMedia(profileId, retryCount + 1);
        
      } else {
        // Try to parse error response
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (jsonError) {
          throw new Error(`HTTP ${response.status}: Gagal menghapus profil sosial media`);
        }
        
        // Handle specific error messages
        if (response.status === 503) {
          throw new Error('Server sedang bermasalah, silakan coba lagi dalam beberapa saat');
        } else {
          throw new Error(errorData.error || 'Gagal menghapus profil sosial media');
        }
      }
    } catch (error) {
      console.error('Delete social media error:', error);
      
      // Network error - might be worth retrying
      if (error.name === 'TypeError' && error.message.includes('fetch') && retryCount < maxRetries) {
        console.log(`Network error, retrying... (attempt ${retryCount + 1}/${maxRetries})`);
        setMessage('Koneksi bermasalah, mencoba lagi...');
        
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return handleDeleteSocialMedia(profileId, retryCount + 1);
      }
      
      setMessage('Error: ' + error.message);
    }
  };

  // Get platform icon
  const getPlatformIcon = (platform) => {
    const platformLower = platform?.toLowerCase() || '';
    if (platformLower.includes('instagram')) {
      return <FontAwesomeIcon icon={faInstagram} className="text-pink-500" />;
    }
    if (platformLower.includes('tiktok')) {
      return <FontAwesomeIcon icon={faTiktok} className="text-black" />;
    }
    if (platformLower.includes('twitter') || platformLower.includes('x.com')) {
      return <FontAwesomeIcon icon={faTwitter} className="text-blue-400" />;
    }
    if (platformLower.includes('youtube')) {
      return <FontAwesomeIcon icon={faYoutube} className="text-red-500" />;
    }
    if (platformLower.includes('facebook')) {
      return <FontAwesomeIcon icon={faFacebook} className="text-blue-600" />;
    }
    if (platformLower.includes('linkedin')) {
      return <FontAwesomeIcon icon={faLinkedin} className="text-blue-700" />;
    }
    return <FontAwesomeIcon icon={faGlobe} className="text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Unified Profile Form */}
      <GlassCard variant="default" padding="lg">
        <div className="flex items-center mb-6">
          <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Profil Saya</h2>
        </div>

        {usernameLoading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nama Lengkap */}
            <div>
              <label htmlFor="nama_lengkap" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nama_lengkap"
                name="nama_lengkap"
                value={formData.nama_lengkap}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border border-white/30 bg-white/20 backdrop-blur-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                  fieldErrors.nama_lengkap ? 'border-red-500 bg-red-50/50' : ''
                }`}
                placeholder="Masukkan nama lengkap Anda"
                required
              />
              {fieldErrors.nama_lengkap && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.nama_lengkap}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">@</span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    fieldErrors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="username_anda"
                  required
                />
              </div>
              {fieldErrors.username && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>
              )}
              {!fieldErrors.username && (
                <p className="mt-1 text-xs text-gray-500">Username tidak boleh mengandung spasi, minimal 3 karakter</p>
              )}
            </div>

            {/* Nomor WhatsApp */}
            <div>
              <label htmlFor="nomer_wa" className="block text-sm font-medium text-gray-700 mb-2">
                Nomor WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nomer_wa"
                name="nomer_wa"
                value={formData.nomer_wa}
                onChange={handleInputChange}
                placeholder="628123456789"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  fieldErrors.nomer_wa ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {fieldErrors.nomer_wa && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.nomer_wa}</p>
              )}
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={userEmail}
                readOnly
                className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl text-gray-600"
                placeholder="Loading email..."
              />
              <p className="mt-1 text-xs text-gray-500">Email diambil otomatis dari akun Anda</p>
            </div>

            {/* Social Media Accounts List */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Akun Media Sosial Saya</h3>
              
              {/* Display existing social media accounts */}
              {allSocialProfiles.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {allSocialProfiles.map((profile) => (
                    <div 
                      key={profile.id} 
                      className="flex items-center justify-between p-4 bg-white/30 backdrop-blur-sm rounded-xl border border-white/30"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getPlatformIcon(profile.platform)}
                          <div>
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {profile.platform}
                            </div>
                            <div className="text-sm text-gray-600">
                              @{profile.username_sosmed}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            // Set edit mode untuk profile tertentu
                            setNewSocialMedia({
                              platform: profile.platform,
                              username: profile.username_sosmed
                            });
                          }}
                          className="text-blue-600 hover:text-blue-500 p-2 hover:bg-blue-50/50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSocialMedia(profile.id)}
                          className="text-red-600 hover:text-red-500 p-2 hover:bg-red-50/50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-300 mb-6">
                  <div className="text-gray-500">
                    Belum ada akun media sosial yang ditambahkan
                  </div>
                </div>
              )}

              {/* Add New Social Media Form */}
              <div className="bg-gray-50/50 backdrop-blur-sm p-4 rounded-xl border border-gray-200">
                <div className="flex items-center mb-3">
                  <PlusIcon className="w-5 h-5 text-green-600 mr-2" />
                  <label className="block text-sm font-medium text-gray-700">
                    Tambah Akun Sosial Media
                  </label>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={newSocialMedia.platform}
                      onChange={(e) => handleNewSocialMediaChange('platform', e.target.value)}
                      className="px-4 py-3 border border-gray-300 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="instagram">Instagram</option>
                    </select>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newSocialMedia.username}
                        onChange={(e) => handleNewSocialMediaChange('username', e.target.value)}
                        placeholder="username"
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          usernameCheckStatus.isAvailable === true 
                            ? 'border-green-500 bg-green-50' 
                            : usernameCheckStatus.isAvailable === false 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                      />
                      {/* Validation Icon */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        {usernameCheckStatus.isChecking && (
                          <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {usernameCheckStatus.isAvailable === true && !usernameCheckStatus.isChecking && (
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                        {usernameCheckStatus.isAvailable === false && !usernameCheckStatus.isChecking && (
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addNewSocialMedia}
                      disabled={usernameCheckStatus.isAvailable !== true}
                      className={`px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${
                        usernameCheckStatus.isAvailable === true 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      }`}
                    >
                      + Tambah
                    </button>
                  </div>
                  
                  {/* Validation Message */}
                  {usernameCheckStatus.message && (
                    <div className={`text-sm px-4 py-2 rounded-lg ${
                      usernameCheckStatus.isAvailable === true 
                        ? 'bg-green-100 text-green-700' 
                        : usernameCheckStatus.isAvailable === false 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      <div className="flex items-center">
                        {usernameCheckStatus.isChecking && (
                          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {usernameCheckStatus.message}
                      </div>
                    </div>
                  )}
                </div>
              </div>


            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className={`w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-6 rounded-xl font-medium text-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <BookmarkIcon className="h-5 w-5 mr-2" />
                  Simpan Profil
                </>
              )}
            </button>
          </form>
        )}
      </GlassCard>
    </div>
  );
}
