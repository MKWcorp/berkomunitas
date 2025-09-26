"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
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
import AdminModal from "../components/AdminModal";
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import ScrollToTopButton from '../components/ScrollToTopButton';

// Badge Shield Component with tooltip using Shields.io
function BadgeShield({ badge, size = "h-4" }) {
  const badgeColor = badge.badge_color || 'blue';
  const badgeStyle = badge.badge_style || 'flat';
  const badgeName = encodeURIComponent(badge.badge_name || 'Badge');
  const badgeMessage = encodeURIComponent(badge.badge_message || 'Achievement');
  const shieldUrl = `https://img.shields.io/badge/${badgeName}-${badgeMessage}-${badgeColor}?style=${badgeStyle}&logo=star&logoColor=white`;
  
  return (
    <div className="relative group inline-block">
      <img 
        src={shieldUrl}
        alt={badge.badge_name}
        className={`${size} hover:scale-105 transition-transform cursor-pointer shadow-sm`}
        onError={(e) => {
          e.target.src = 'https://img.shields.io/badge/Badge-Achievement-blue?style=flat&logo=star&logoColor=white';
        }}
      />
      
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        <div className="font-medium">{badge.badge_name}</div>
        {badge.description && (
          <div className="text-xs text-gray-300 mt-1 max-w-48 whitespace-normal">{badge.description}</div>
        )}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}

function BadgeModal({ 
  open, 
  onClose, 
  badge = null, 
  onSave, 
  onDelete, 
  position = null, 
  mode = 'create' 
}) {
  const [form, setForm] = useState({
    badge_name: '',
    description: '',
    badge_color: 'blue',
    badge_style: 'flat',
    badge_message: '',
    ...badge
  });

  useEffect(() => {
    if (badge) {
      setForm({ 
        badge_name: '',
        description: '',
        badge_color: 'blue',
        badge_style: 'flat',
        badge_message: '',
        ...badge 
      });
    } else {
      setForm({
        badge_name: '',
        description: '',
        badge_color: 'blue',
        badge_style: 'flat',
        badge_message: ''
      });
    }
  }, [badge, open]);

  const colorOptions = [
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
    { value: 'red', label: 'Red' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'orange', label: 'Orange' },
    { value: 'purple', label: 'Purple' },
    { value: 'pink', label: 'Pink' },
    { value: 'gray', label: 'Gray' }
  ];

  const styleOptions = [
    { value: 'flat', label: 'Flat' },
    { value: 'flat-square', label: 'Flat Square' },
    { value: 'plastic', label: 'Plastic' },
    { value: 'for-the-badge', label: 'For The Badge' }
  ];

  return (
    <AdminModal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? "Tambah Badge Baru" : "Edit Badge"}
      maxWidth="max-w-2xl"
      position={position}
    >
      <div className="space-y-6">
        <GlassCard className="p-4">
          <h4 className="font-medium text-gray-900 mb-2">Preview Badge:</h4>
          <BadgeShield badge={form} size="h-8" />
        </GlassCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Badge <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50"
              placeholder="e.g. Top Contributor"
              value={form.badge_name}
              onChange={(e) => setForm({...form, badge_name: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Badge Message <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50"
              placeholder="e.g. Level 5"
              value={form.badge_message}
              onChange={(e) => setForm({...form, badge_message: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Warna Badge</label>
            <select
              className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50"
              value={form.badge_color}
              onChange={(e) => setForm({...form, badge_color: e.target.value})}
            >
              {colorOptions.map(color => (
                <option key={color.value} value={color.value}>{color.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Style Badge</label>
            <select
              className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50"
              value={form.badge_style}
              onChange={(e) => setForm({...form, badge_style: e.target.value})}
            >
              {styleOptions.map(style => (
                <option key={style.value} value={style.value}>{style.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
          <textarea
            className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50"
            rows={3}
            placeholder="Deskripsi singkat tentang badge ini..."
            value={form.description}
            onChange={(e) => setForm({...form, description: e.target.value})}
          />
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-white/20">
          <div>
            {mode === 'edit' && onDelete && (
              <GlassButton 
                variant="danger" 
                onClick={() => onDelete(badge.id)}
                className="mr-2"
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
              disabled={!form.badge_name || !form.badge_message}
            >
              {mode === 'create' ? 'Tambah Badge' : 'Simpan Perubahan'}
            </GlassButton>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}

export default function BadgesPage() {
  const { user } = useUser();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editBadge, setEditBadge] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [modalPosition, setModalPosition] = useState(null);

  useEffect(() => {
    fetchBadges();
  }, []);

  async function fetchBadges() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/badges');
      if (!res.ok) throw new Error('Failed to fetch badges');
      const data = await res.json();
      setBadges(Array.isArray(data.badges) ? data.badges : []);
    } catch (error) {
      console.error('Error fetching badges:', error);
      setBadges([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveBadge(form) {
    try {
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const url = modalMode === 'create' ? '/api/admin/badges' : `/api/admin/badges/${editBadge.id}`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error(`Failed to ${modalMode} badge`);
      
      setModalOpen(false);
      setEditBadge(null);
      setModalPosition(null);
      fetchBadges();
    } catch (error) {
      console.error('Error saving badge:', error);
      alert(`Gagal ${modalMode === 'create' ? 'menambah' : 'mengupdate'} badge`);
    }
  }

  async function handleDeleteBadge(badgeId) {
    if (!confirm('Apakah Anda yakin ingin menghapus badge ini?')) return;
    
    try {
      const res = await fetch(`/api/admin/badges/${badgeId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete badge');
      
      setModalOpen(false);
      setEditBadge(null);
      setModalPosition(null);
      fetchBadges();
    } catch (error) {
      console.error('Error deleting badge:', error);
      alert('Gagal menghapus badge');
    }
  }

  function handleCreateBadge(event) {
    if (event) {
      const rect = event.target.getBoundingClientRect();
      setModalPosition({
        top: rect.bottom + window.scrollY + 8,
        left: Math.min(rect.left + window.scrollX, window.innerWidth - 600)
      });
    }
    setModalMode('create');
    setEditBadge(null);
    setModalOpen(true);
  }

  function handleEditBadge(badge, event) {
    if (event) {
      const rect = event.target.getBoundingClientRect();
      setModalPosition({
        top: rect.bottom + window.scrollY + 8,
        left: Math.min(rect.left + window.scrollX, window.innerWidth - 600)
      });
    }
    setModalMode('edit');
    setEditBadge(badge);
    setModalOpen(true);
  }

  // Filter badges based on search
  const filteredBadges = badges.filter(badge =>
    badge.badge_name?.toLowerCase().includes(search.toLowerCase()) ||
    badge.description?.toLowerCase().includes(search.toLowerCase()) ||
    badge.badge_message?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <AdminPageLayout>
        <AdminPageHeader 
          title="Kelola Badge"
          description="Kelola badge dan penghargaan untuk anggota komunitas"
          actions={
            <div className="flex gap-3">
              <AdminSearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari badge..."
              />
              <GlassButton 
                variant="primary" 
                onClick={handleCreateBadge}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Tambah Badge
              </GlassButton>
            </div>
          }
        />
        
        <AdminContentContainer>
          <BadgeModal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setEditBadge(null);
              setModalPosition(null);
            }}
            badge={editBadge}
            onSave={handleSaveBadge}
            onDelete={handleDeleteBadge}
            position={modalPosition}
            mode={modalMode}
          />

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <div className="text-gray-600">Memuat data badge...</div>
            </div>
          ) : filteredBadges.length === 0 && search ? (
            <AdminEmptyState
              title="Tidak ada hasil"
              description={`Tidak ada badge yang cocok dengan pencarian "${search}"`}
            />
          ) : filteredBadges.length === 0 ? (
            <AdminEmptyState
              title="Belum ada badge"
              description="Belum ada badge yang dibuat dalam sistem"
              actionText="Tambah Badge Pertama"
              onAction={handleCreateBadge}
              icon={ShieldCheckIcon}
            />
          ) : (
            <AdminTableContainer>
              <AdminTableHeader>
                <AdminTableHeaderCell>Preview</AdminTableHeaderCell>
                <AdminTableHeaderCell>Nama Badge</AdminTableHeaderCell>
                <AdminTableHeaderCell>Message</AdminTableHeaderCell>
                <AdminTableHeaderCell>Deskripsi</AdminTableHeaderCell>
                <AdminTableHeaderCell>Style</AdminTableHeaderCell>
                <AdminTableHeaderCell>Aksi</AdminTableHeaderCell>
              </AdminTableHeader>
              <AdminTableBody>
                {filteredBadges.map((badge) => (
                  <AdminTableRow key={badge.id}>
                    <AdminTableCell>
                      <BadgeShield badge={badge} size="h-6" />
                    </AdminTableCell>
                    <AdminTableCell className="font-medium">
                      {badge.badge_name}
                    </AdminTableCell>
                    <AdminTableCell>
                      {badge.badge_message}
                    </AdminTableCell>
                    <AdminTableCell className="max-w-xs">
                      <div className="truncate" title={badge.description}>
                        {badge.description || '-'}
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>
                      <AdminStatusBadge 
                        status={`${badge.badge_color} / ${badge.badge_style}`}
                        variant="info"
                      />
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 rounded-lg hover:bg-white/20 transition-colors text-blue-600"
                          onClick={(e) => handleEditBadge(badge, e)}
                          title="Edit Badge"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
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
