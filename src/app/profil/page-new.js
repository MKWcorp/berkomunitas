'use client';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import DuplicateDataDialog from '../components/DuplicateDataDialog';

const TABS = [
  { key: 'edit', label: 'Edit Profil' },
  { key: 'badges', label: 'Lencana Saya' },
];

export default function ProfileDashboard() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const isRequired = searchParams.get('required') === 'true';
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('edit');
  const [message, setMessage] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
  // Hapus fetchDashboard, gunakan fetch user info lain jika perlu
    
    if (isLoaded && user) {
      // TODO: fetch user info jika perlu
    } else if (isLoaded && !user) {
      setLoading(false);
      setMessage('Silakan login untuk melihat profil.');
    }
  }, [user, isLoaded]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Ukuran file maksimal 5MB');
      return;
    }

    setUploading(true);
  const formData = new FormData();
  // API expects 'file'; keep consistent
  formData.append('file', file);

    try {
      const response = await fetch('/api/profil/upload-foto', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Upload gagal (${response.status})`);
      }

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error('Response bukan JSON yang valid.');
      }

      if (result?.success) {
        const url = result.foto_profil_url || result.data?.foto_profil_url;
        if (url) setProfilePictureUrl(url);
        setMessage('Foto profil berhasil diperbarui!');
      } else {
        throw new Error(result?.error || 'Gagal mengupload foto');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <div className="text-xl font-semibold text-blue-200">Memuat profil...</div>
      </div>
    </div>
  );
  
  // ...hapus blok error dashboard

  // TODO: fetch dan parsing data user jika perlu
  const member = {};
  const socialProfiles = [];
  const badges = [];
  const level = {};
  const isProfileIncomplete = false;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Toast Notification */}
        {message && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl transition-all duration-500 ${
            message.includes('berhasil') 
              ? 'bg-green-500/20 border border-green-500/30 text-green-300' 
              : 'bg-red-500/20 border border-red-500/30 text-red-300'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {message.includes('berhasil') ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{message}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setMessage('')}
                  className="inline-flex text-gray-400 hover:text-gray-300"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Incomplete Warning */}
        {(isRequired || isProfileIncomplete) && (
          <div className="bg-red-500/20 border-l-4 border-red-500 p-4 mb-6 rounded-2xl">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-300">
                  Profil Belum Lengkap
                </h3>
                <div className="mt-2 text-sm text-red-400">
                  <p>
                    Anda harus melengkapi profil sebelum dapat mengakses fitur lainnya. Pastikan mengisi:
                  </p>
                  <ul className="list-disc ml-5 mt-2">
                    {!member.nama_lengkap && <li>Nama lengkap</li>}
                    {!member.nomer_wa && <li>Nomor WhatsApp</li>}
                    {(!socialProfiles || socialProfiles.length === 0) && <li>Minimal 1 akun sosial media</li>}
                  </ul>
                  <p className="mt-2 font-medium text-yellow-300">
                    Bonus: Dapatkan +5 loyalty point setelah profil lengkap!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Profile Header */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={profilePictureUrl} 
                alt="Profile" 
                className="w-24 h-24 rounded-2xl object-cover border-4 border-gray-600 shadow-md"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-2xl flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-t-blue-500 border-gray-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <div className="flex-grow">
              <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                {member.nama_lengkap || 'Profil Anda'}
              </h1>
              {member.status_kustom && (
                <p className="text-sm text-gray-300 italic mb-2">"{member.status_kustom}"</p>
              )}
              {member.bio && (
                <p className="text-sm text-gray-400 mb-3 leading-relaxed">{member.bio}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mb-2">
                <span className="text-blue-300 font-semibold">
                  Level {level.current?.level_number || 1}: {level.current?.level_name || '-'}
                </span>
                <span className="text-gray-300">
                  Loyalty Point: <span className="font-bold text-yellow-400">{member.loyalty_point || 0}</span>
                </span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <button 
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
              >
                {uploading ? 'Mengupload...' : 'Ganti Foto Profil'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-800/40 p-1 rounded-2xl">
            {TABS.map((tabItem) => (
              <button
                key={tabItem.key}
                onClick={() => setTab(tabItem.key)}
                className={`flex-1 py-3 px-4 rounded-2xl font-medium text-sm transition-all duration-300 ${
                  tab === tabItem.key
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-400 hover:text-blue-200 hover:bg-gray-700/40'
                }`}
              >
                {tabItem.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700 p-6">
          {tab === 'edit' && <EditProfileTab member={member} socialProfiles={socialProfiles} message={message} setMessage={setMessage} />}
          {tab === 'badges' && <BadgesTab badges={badges} />}
        </div>
      </div>
    </div>
  );
}

// Edit Profile Tab Component dengan tema gelap
function EditProfileTab({ member, socialProfiles, message, setMessage }) {
  const [formData, setFormData] = useState({
    nama_lengkap: member.nama_lengkap || '',
    nomer_wa: member.nomer_wa || '',
    bio: member.bio || '',
    status_kustom: member.status_kustom || '',
  });
  const [socialLink, setSocialLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [socialProfiles2, setSocialProfiles] = useState(socialProfiles || []);
  const [duplicateDialogData, setDuplicateDialogData] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Username management state
  const [usernameData, setUsernameData] = useState({
    username: '',
    display_name: '',
    has_username: false,
    is_custom: false
  });
  const [usernameForm, setUsernameForm] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(true);
  const [usernameMessage, setUsernameMessage] = useState('');

  // Fetch username data on mount
  useEffect(() => {
    fetchUsernameData();
  }, []);

  const fetchUsernameData = async () => {
    try {
      const response = await fetch('/api/profil/username');
      const data = await response.json();
      
      if (response.ok) {
        setUsernameData(data);
        setUsernameForm(data.username || '');
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setFieldErrors({});

    try {
      const response = await fetch('/api/profil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const result = await response.json();
      if (result.success) {
        if (result.data?.duplicateDialogData) {
          setDuplicateDialogData(result.data.duplicateDialogData);
        } else {
          setMessage('Profil berhasil diperbarui!');
          setTimeout(() => window.location.reload(), 1500);
        }
      } else {
        if (result.duplicate && result.field) {
          setFieldErrors({ [result.field]: result.error });
        } else {
          throw new Error(result.error || 'Gagal menyimpan profil.');
        }
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    
    if (!usernameForm.trim()) {
      setUsernameMessage('Username tidak boleh kosong');
      return;
    }

    setSaving(true);
    setUsernameMessage('');

    try {
      const response = await fetch('/api/profil/username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: usernameForm.trim() })
      });

      const result = await response.json();

      if (response.ok) {
        setUsernameMessage('✅ Username berhasil diperbarui!');
        setUsernameData(prev => ({
          ...prev,
          username: result.data.username,
          display_name: result.data.display_name,
          has_username: true,
          is_custom: true
        }));
        setTimeout(() => setUsernameMessage(''), 5000);
      } else {
        setUsernameMessage(result.error || 'Gagal memperbarui username');
      }
    } catch (error) {
      console.error('Error updating username:', error);
      setUsernameMessage('Terjadi kesalahan saat memperbarui username');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSocial = async (e) => {
    e.preventDefault();
    if (!socialLink.trim()) {
      setFieldErrors({ social_link: 'Link sosial media harus diisi.' });
      return;
    }

    setSaving(true);
    setFieldErrors({});
    try {
      const response = await fetch('/api/profil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_social_link',
          link: socialLink.trim(),
        }),
        credentials: 'include',
      });

      const result = await response.json();
      if (result.success) {
        setSocialProfiles(prev => [...prev, result.data]);
        setSocialLink('');
        setMessage('Akun sosial media berhasil ditambahkan!');
      } else {
        if (result.duplicate && result.field) {
          setFieldErrors({ [result.field]: result.error });
        } else {
          throw new Error(result.error || 'Gagal menambahkan akun sosial media.');
        }
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSocial = async (id) => {
    if (!confirm('Yakin ingin menghapus akun sosial media ini?')) return;

    setSaving(true);
    try {
      const response = await fetch('/api/profil', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove_social', id }),
        credentials: 'include',
      });

      const result = await response.json();
      if (result.success) {
        setSocialProfiles(prev => prev.filter(s => s.id !== id));
        setMessage('Akun sosial media berhasil dihapus!');
      } else {
        throw new Error(result.error || 'Gagal menghapus akun sosial media.');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {duplicateDialogData && (
        <DuplicateDataDialog
          data={duplicateDialogData}
          onClose={() => setDuplicateDialogData(null)}
          onConfirm={() => window.location.reload()}
        />
      )}

      <div>
        <h2 className="font-bold mb-4 text-white">Edit Profil</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nama Lengkap <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="nama_lengkap"
              value={formData.nama_lengkap}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-700/60 border border-gray-600 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nomor WhatsApp <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="nomer_wa"
              value={formData.nomer_wa}
              onChange={handleInputChange}
              placeholder="Contoh: 628123456789"
              className="w-full p-3 bg-gray-700/60 border border-gray-600 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
            {fieldErrors.nomer_wa && (
              <div className="mt-1 text-sm text-red-400 bg-red-500/20 p-2 rounded-2xl border border-red-500/30">
                {fieldErrors.nomer_wa}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Ceritakan sedikit tentang diri Anda..."
              rows={4}
              className="w-full p-3 bg-gray-700/60 border border-gray-600 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-vertical"
            />
            <p className="text-xs text-gray-400 mt-1">Opsional - Deskripsi singkat tentang diri Anda</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Status Kustom
            </label>
            <input
              type="text"
              name="status_kustom"
              value={formData.status_kustom}
              onChange={handleInputChange}
              placeholder="Contoh: Sedang fokus mengerjakan tugas!"
              maxLength={100}
              className="w-full p-3 bg-gray-700/60 border border-gray-600 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">
              Opsional - Status singkat yang akan ditampilkan di profil Anda (maksimal 100 karakter)
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formData.status_kustom.length}/100 karakter
            </p>
          </div>
        </form>
      </div>

      {/* Social Media Management */}
      <div>
        <h3 className="font-bold mb-4 text-white">Akun Sosial Media</h3>
        
        <div className="space-y-2 mb-4">
          {socialProfiles2.map((social) => (
            <div key={social.id} className="flex items-center justify-between p-3 bg-gray-700/40 rounded-2xl">
              <div>
                <span className="font-medium capitalize text-white">{social.platform}</span>
                <span className="text-gray-300 ml-2">@{social.username_sosmed}</span>
              </div>
              <button
                onClick={() => handleRemoveSocial(social.id)}
                className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded-2xl hover:bg-red-500/10 transition-all"
                disabled={saving}
              >
                Hapus
              </button>
            </div>
          ))}
          {socialProfiles2.length === 0 && (
            <div className="text-gray-400 text-center py-4">
              Belum ada akun sosial media yang ditambahkan
            </div>
          )}
        </div>

        <form onSubmit={handleAddSocial} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Link Profil Sosial Media <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              name="social_link"
              value={socialLink}
              onChange={(e) => setSocialLink(e.target.value)}
              placeholder="Contoh: https://instagram.com/johndoe"
              className="w-full p-3 bg-gray-700/60 border border-gray-600 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
            {fieldErrors.social_link && (
              <div className="mt-1 text-sm text-red-400 bg-red-500/20 p-2 rounded-2xl border border-red-500/30">
                {fieldErrors.social_link}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Menambahkan...' : 'Tambah Akun Sosial Media'}
          </button>
        </form>
      </div>

      {/* Username Management Section */}
      <div className="border-t border-gray-700 pt-6">
        <h3 className="text-lg font-semibold text-white mb-4">🔗 Username Profil Publik</h3>
        
        {usernameLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {usernameData.has_username ? (
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-blue-300">Username Saat Ini:</h4>
                    <p className="text-blue-200 font-mono">@{usernameData.username}</p>
                    <p className="text-sm text-blue-400 mt-1">
                      📋 Link profil: <a href={`/profil/${usernameData.username}`} className="underline" target="_blank">/profil/{usernameData.username}</a>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-4 mb-4">
                <p className="text-yellow-200">
                  Anda belum memiliki username untuk profil publik. Buat username untuk membuat profil Anda dapat diakses melalui link khusus.
                </p>
              </div>
            )}

            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username Profil Publik {!usernameData.has_username && <span className="text-red-400">*</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">@</span>
                  <input
                    type="text"
                    value={usernameForm}
                    onChange={(e) => setUsernameForm(e.target.value)}
                    placeholder="username-unik-anda"
                    className="w-full pl-8 pr-3 py-3 bg-gray-700/60 border border-gray-600 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    pattern="[a-zA-Z0-9_-]{3,50}"
                    title="Username hanya boleh mengandung huruf, angka, underscore, dan dash. Minimal 3 karakter."
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  3-50 karakter. Hanya huruf, angka, underscore (_), dan dash (-). Display name akan menggunakan nama lengkap Anda.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving || !usernameForm.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 px-4 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Menyimpan...' : usernameData.has_username ? 'Update Username' : 'Buat Username'}
              </button>
            </form>

            {usernameMessage && (
              <div className={`mt-4 p-4 rounded-2xl ${usernameMessage.includes('✅') ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                {usernameMessage}
              </div>
            )}
          </>
        )}
      </div>

      {/* Complete Profile Save Button */}
      <div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Menyimpan...' : 'Simpan Profil Lengkap'}
        </button>
        <p className="text-sm text-gray-400 text-center mt-2">
          Simpan untuk menyelesaikan semua perubahan profil Anda
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl ${message.includes('berhasil') ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

// Enhanced Badges Tab Component dengan tema gelap
function BadgesTab({ badges }) {
  const [availableBadges, setAvailableBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableBadges();
  }, []);

  const fetchAvailableBadges = async () => {
    try {
      const response = await fetch('/api/admin/badges');
      if (response.ok) {
        const data = await response.json();
        setAvailableBadges(data.badges || []);
      }
    } catch (error) {
      console.error('Error fetching available badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeProgress = (badge) => {
    const earned = badges.find(b => b.id_badge === badge.id);
    return {
      earned: !!earned,
      earnedAt: earned?.earned_at || null
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Lencana yang Diperoleh */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">🏆 Lencana yang Diperoleh ({badges.length})</h2>
        {badges.length === 0 ? (
          <div className="text-center py-8 bg-gray-700/40 rounded-2xl">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-gray-300">Belum ada lencana yang diperoleh.</p>
            <p className="text-sm text-gray-400 mt-2">Mulai berpartisipasi untuk mendapatkan lencana pertama Anda!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge, i) => (
              <div key={i} className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30 rounded-2xl p-4 relative">
                <div className="absolute top-2 right-2">
                  <span className="text-2xl">🏆</span>
                </div>
                <div className="text-lg font-bold text-yellow-300 mb-2">{badge.badge_name}</div>
                <p className="text-sm text-yellow-200 mb-3">{badge.description}</p>
                <div className="text-xs text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded-2xl">
                  Diperoleh: {badge.earned_at ? new Date(badge.earned_at).toLocaleDateString('id-ID') : '-'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Semua Lencana yang Tersedia */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">🎯 Semua Lencana Tersedia ({availableBadges.length})</h2>
        <p className="text-gray-300 mb-6">
          Kumpulkan semua lencana dengan berpartisipasi aktif dalam komunitas!
        </p>
        
        {availableBadges.length === 0 ? (
          <div className="text-center py-8 bg-gray-700/40 rounded-2xl">
            <p className="text-gray-300">Tidak ada data lencana yang tersedia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableBadges.map((badge) => {
              const progress = getBadgeProgress(badge);
              return (
                <div 
                  key={badge.id} 
                  className={`rounded-2xl p-4 border-2 transition-all duration-300 hover:scale-105 ${
                    progress.earned 
                      ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30' 
                      : 'bg-gray-700/40 border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg ${progress.earned ? 'text-green-300' : 'text-gray-300'}`}>
                        {badge.badge_name}
                      </h3>
                      <p className={`text-sm mt-1 ${progress.earned ? 'text-green-200' : 'text-gray-400'}`}>
                        {badge.description}
                      </p>
                    </div>
                    <div className="ml-3">
                      {progress.earned ? (
                        <span className="text-2xl">✅</span>
                      ) : (
                        <span className="text-2xl opacity-30">🎯</span>
                      )}
                    </div>
                  </div>

                  {/* Kriteria Badge */}
                  <div className={`text-xs px-3 py-2 rounded-2xl ${
                    progress.earned ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    <div className="font-medium mb-1">
                      {progress.earned ? '🎉 Sudah Diperoleh!' : '📋 Cara Mendapatkan:'}
                    </div>
                    <div>
                      {progress.earned ? (
                        `Diperoleh pada ${new Date(progress.earnedAt).toLocaleDateString('id-ID')}`
                      ) : (
                        `${badge.criteria_type}: ${badge.criteria_value} ${
                          badge.criteria_type === 'comment_count' ? 'komentar' :
                          badge.criteria_type === 'loyalty_points' ? 'poin' :
                          badge.criteria_type === 'task_completion' ? 'tugas selesai' :
                          badge.criteria_type === 'social_media_count' ? 'akun sosial media' :
                          'aktivitas'
                        }`
                      )}
                    </div>
                  </div>

                  {/* Progress Bar untuk Badge yang Belum Diperoleh */}
                  {!progress.earned && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: '0%' }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Mulai berpartisipasi untuk mendapatkan lencana ini
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-blue-500/30">
        <h3 className="text-lg font-bold text-white mb-4">📊 Statistik Lencana</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">{badges.length}</div>
            <div className="text-sm text-gray-300">Diperoleh</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">{availableBadges.length - badges.length}</div>
            <div className="text-sm text-gray-300">Tersisa</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              {availableBadges.length > 0 ? Math.round((badges.length / availableBadges.length) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-300">Progres</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400">{availableBadges.length}</div>
            <div className="text-sm text-gray-300">Total</div>
          </div>
        </div>
      </div>
    </div>
  );
}
