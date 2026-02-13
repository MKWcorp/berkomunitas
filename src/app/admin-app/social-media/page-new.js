'use client';
import { useState, useEffect } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { 
  AdminPageLayout,
  AdminPageHeader,
  AdminContentContainer,
  AdminTableContainer,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
  AdminSearchInput,
  AdminEmptyState,
  AdminStatusBadge
} from '@/components/AdminComponents';
import { GlassCard, GlassButton } from '@/components/GlassLayout';
import AdminModal from '../components/AdminModal';
import { 
  GlobeAltIcon, 
  UserIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFacebook, 
  faTwitter, 
  faInstagram, 
  faTiktok, 
  faYoutube, 
  faLinkedin,
  faTelegram,
  faDiscord,
  faGithub
} from '@fortawesome/free-brands-svg-icons';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import ScrollToTopButton from '../components/ScrollToTopButton';

// Platform icon mapping
const platformIcons = {
  facebook: faFacebook,
  twitter: faTwitter,
  instagram: faInstagram,
  tiktok: faTiktok,
  youtube: faYoutube,
  linkedin: faLinkedin,
  telegram: faTelegram,
  discord: faDiscord,
  github: faGithub,
  website: faGlobe,
  other: faGlobe
};

const platformColors = {
  facebook: 'text-blue-600',
  twitter: 'text-sky-500',
  instagram: 'text-pink-600',
  tiktok: 'text-black',
  youtube: 'text-red-600',
  linkedin: 'text-blue-700',
  telegram: 'text-blue-500',
  discord: 'text-purple-600',
  github: 'text-gray-800',
  website: 'text-green-600',
  other: 'text-gray-600'
};

function SocialMediaModal({ open, onClose, socialMedia = null, onSave, onDelete, mode = 'create' }) {
  const [form, setForm] = useState({
    member_id: '',
    platform: 'facebook',
    account_url: '',
    username: '',
    ...socialMedia
  });

  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (socialMedia) {
      setForm({
        member_id: '',
        platform: 'facebook',
        account_url: '',
        username: '',
        ...socialMedia
      });
    } else {
      setForm({
        member_id: '',
        platform: 'facebook',
        account_url: '',
        username: ''
      });
    }
  }, [socialMedia, open]);

  async function fetchMembers() {
    try {
      const res = await fetch('/api/admin/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(Array.isArray(data.members) ? data.members : []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }

  const platformOptions = [
    { value: 'facebook', label: 'Facebook' },
    { value: 'twitter', label: 'Twitter/X' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'discord', label: 'Discord' },
    { value: 'github', label: 'GitHub' },
    { value: 'website', label: 'Website' },
    { value: 'other', label: 'Lainnya' }
  ];

  return (
    <AdminModal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? "Tambah Social Media" : "Edit Social Media"}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50"
              value={form.member_id}
              onChange={(e) => setForm({...form, member_id: e.target.value})}
              required
            >
              <option value="">Pilih Member</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.nama_lengkap} ({member.username || member.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50"
              value={form.platform}
              onChange={(e) => setForm({...form, platform: e.target.value})}
              required
            >
              {platformOptions.map(platform => (
                <option key={platform.value} value={platform.value}>
                  {platform.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username/Handle <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50"
              placeholder="e.g. @username"
              value={form.username}
              onChange={(e) => setForm({...form, username: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Akun <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50"
              placeholder="https://..."
              value={form.account_url}
              onChange={(e) => setForm({...form, account_url: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-white/20">
          <div>
            {mode === 'edit' && onDelete && (
              <GlassButton 
                variant="danger" 
                onClick={() => onDelete(socialMedia.id)}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Hapus
              </GlassButton>
            )}
          </div>
          <div className="flex gap-3">
            <GlassButton variant="secondary" onClick={onClose}>
              Batal
            </GlassButton>
            <GlassButton 
              variant="primary" 
              onClick={() => onSave(form)}
              disabled={!form.member_id || !form.platform || !form.username || !form.account_url}
            >
              {mode === 'create' ? 'Tambah' : 'Simpan Perubahan'}
            </GlassButton>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}

export default function SocialMediaPage() {
  const { user, isLoaded } = useSSOUser();
  const router = useRouter();
  const [socialMedias, setSocialMedias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editSocialMedia, setEditSocialMedia] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user?.email) {
      router.push('/sign-in');
      return;
    }
    checkAdminAccess();
  }, [user, isLoaded, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchSocialMedias();
    }
  }, [isAdmin]);

  async function checkAdminAccess() {
    try {
      const res = await fetch('/api/admin/check');
      if (res.ok) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      setIsAdmin(false);
    }
  }

  async function fetchSocialMedias() {
    setLoading(true);
    console.log('🔍 Fetching social medias...');
    try {
      const res = await fetch('/api/admin/social-media');
      console.log('📡 Response status:', res.status, 'OK:', res.ok);
      
      if (!res.ok) throw new Error('Failed to fetch social media data');
      const data = await res.json();
      console.log('📊 API Response:', data);
      
      // API sekarang mengembalikan flat array 'socialMedias'
      const socialMediaArray = Array.isArray(data.socialMedias) ? data.socialMedias : [];
      console.log('🔄 Setting socialMedias array:', socialMediaArray.length, 'items');
      console.log('🔍 Sample data:', socialMediaArray.slice(0, 2));
      setSocialMedias(socialMediaArray);
    } catch (error) {
      console.error('❌ Error fetching social medias:', error);
      setSocialMedias([]);
    } finally {
      setLoading(false);
      console.log('✅ Fetch complete, loading set to false');
    }
  }

  async function handleSaveSocialMedia(form) {
    try {
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const url = modalMode === 'create' ? '/api/admin/social-media' : `/api/admin/social-media/${editSocialMedia.id}`;
      
      // Map frontend field names to backend field names
      const payload = {
        id_member: form.member_id,
        platform: form.platform,
        username_sosmed: form.username,
        profile_link: form.account_url
      };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${modalMode} social media`);
      }
      
      setModalOpen(false);
      setEditSocialMedia(null);
      fetchSocialMedias();
    } catch (error) {
      console.error('Error saving social media:', error);
      alert(`Gagal ${modalMode === 'create' ? 'menambah' : 'mengupdate'} social media: ${error.message}`);
    }
  }

  async function handleDeleteSocialMedia(socialMediaId) {
    if (!confirm('Apakah Anda yakin ingin menghapus data social media ini?')) return;
    
    try {
      const res = await fetch(`/api/admin/social-media/${socialMediaId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete social media');
      
      setModalOpen(false);
      setEditSocialMedia(null);
      fetchSocialMedias();
    } catch (error) {
      console.error('Error deleting social media:', error);
      alert('Gagal menghapus social media');
    }
  }

  function handleCreateSocialMedia() {
    setModalMode('create');
    setEditSocialMedia(null);
    setModalOpen(true);
  }

  function handleEditSocialMedia(socialMedia) {
    setModalMode('edit');
    // Map API response fields to form fields
    const mappedData = {
      id: socialMedia.id,
      member_id: socialMedia.member?.id || '',
      platform: socialMedia.platform,
      username: socialMedia.username,
      account_url: socialMedia.account_url
    };
    setEditSocialMedia(mappedData);
    setModalOpen(true);
  }

  // Filter social medias based on search
  const filteredSocialMedias = socialMedias.filter(sm => {
    if (!search) return true; // Show all if no search
    
    const searchLower = search.toLowerCase();
    const matchName = sm.member?.nama_lengkap?.toLowerCase().includes(searchLower);
    const matchPlatform = sm.platform?.toLowerCase().includes(searchLower);
    const matchUsername = sm.username?.toLowerCase().includes(searchLower);
    const matchUrl = sm.account_url?.toLowerCase().includes(searchLower);
    
    const isMatch = matchName || matchPlatform || matchUsername || matchUrl;
    
    if (search && search.length > 2) {
      console.log('🔎 Search:', search, '| Member:', sm.member?.nama_lengkap, '| Match:', isMatch);
    }
    
    return isMatch;
  });
  
  console.log('📊 Total items:', socialMedias.length, '| Filtered:', filteredSocialMedias.length, '| Search:', search);

  if (!isLoaded || loading) {
    return (
      <AdminLayout>
        <AdminPageLayout>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-gray-600">Memuat data...</div>
          </div>
        </AdminPageLayout>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout>
        <AdminPageLayout>
          <AdminEmptyState
            title="Akses Ditolak"
            description="Anda tidak memiliki akses ke halaman admin"
            icon={ExclamationTriangleIcon}
          />
        </AdminPageLayout>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageLayout>
        <AdminPageHeader 
          title="Kelola Social Media"
          description="Kelola akun social media anggota komunitas"
          actions={
            <div className="flex gap-3">
              <AdminSearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari member, platform..."
              />
              <GlassButton 
                variant="primary" 
                onClick={handleCreateSocialMedia}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Tambah Social Media
              </GlassButton>
            </div>
          }
        />
        
        <AdminContentContainer>
          <SocialMediaModal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setEditSocialMedia(null);
            }}
            socialMedia={editSocialMedia}
            onSave={handleSaveSocialMedia}
            onDelete={handleDeleteSocialMedia}
            mode={modalMode}
          />

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <div className="text-gray-600">Memuat data social media...</div>
            </div>
          ) : filteredSocialMedias.length === 0 && search ? (
            <AdminEmptyState
              title="Tidak ada hasil"
              description={`Tidak ada social media yang cocok dengan pencarian "${search}"`}
            />
          ) : filteredSocialMedias.length === 0 ? (
            <AdminEmptyState
              title="Belum ada social media"
              description="Belum ada data social media yang terdaftar dalam sistem"
              actionText="Tambah Social Media Pertama"
              onAction={handleCreateSocialMedia}
              icon={GlobeAltIcon}
            />
          ) : (
            <AdminTableContainer>
              <AdminTableHeader>
                <AdminTableHeaderCell>Member</AdminTableHeaderCell>
                <AdminTableHeaderCell>Platform</AdminTableHeaderCell>
                <AdminTableHeaderCell>Username</AdminTableHeaderCell>
                <AdminTableHeaderCell>URL</AdminTableHeaderCell>
                <AdminTableHeaderCell>Aksi</AdminTableHeaderCell>
              </AdminTableHeader>
              <AdminTableBody>
                {filteredSocialMedias.map((sm) => (
                  <AdminTableRow key={sm.id}>
                    <AdminTableCell className="font-medium">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {sm.member?.nama_lengkap || 'Unknown Member'}
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="flex items-center">
                        <FontAwesomeIcon 
                          icon={platformIcons[sm.platform] || platformIcons.other}
                          className={`h-4 w-4 mr-2 ${platformColors[sm.platform] || platformColors.other}`}
                        />
                        <span className="capitalize">{sm.platform}</span>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>
                      {sm.username || '-'}
                    </AdminTableCell>
                    <AdminTableCell>
                      <a 
                        href={sm.account_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center max-w-xs truncate"
                        title={sm.account_url}
                      >
                        <LinkIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                        {sm.account_url}
                      </a>
                    </AdminTableCell>
                    <AdminTableCell>
                      <button
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors text-blue-600"
                        onClick={() => handleEditSocialMedia(sm)}
                        title="Edit Social Media"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTableBody>
            </AdminTableContainer>
          )}
        </AdminContentContainer>
      </AdminPageLayout>
      <ScrollToTopButton />
    </AdminLayout>
  );
}
