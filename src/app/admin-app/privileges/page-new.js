'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
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
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  UserIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import ScrollToTopButton from '../components/ScrollToTopButton';

function PrivilegeModal({ open, onClose, privilege = null, onSave, onDelete, mode = 'create' }) {
  const [form, setForm] = useState({
    clerk_id: '',
    privilege: 'user',
    is_active: true,
    ...privilege
  });

  useEffect(() => {
    if (privilege) {
      setForm({
        clerk_id: '',
        privilege: 'user',
        is_active: true,
        ...privilege
      });
    } else {
      setForm({
        clerk_id: '',
        privilege: 'user',
        is_active: true
      });
    }
  }, [privilege, open]);

  const privilegeOptions = [
    { value: 'user', label: 'User', description: 'Hak akses standar pengguna' },
    { value: 'moderator', label: 'Moderator', description: 'Dapat mengelola konten dan member' },
    { value: 'admin', label: 'Admin', description: 'Akses penuh ke admin panel' },
    { value: 'super_admin', label: 'Super Admin', description: 'Akses tertinggi sistem' }
  ];

  return (
    <AdminModal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? "Tambah Privilege" : "Edit Privilege"}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        <GlassCard className="p-4">
          <div className="flex items-center text-blue-800">
            <ShieldCheckIcon className="h-5 w-5 mr-2" />
            <div>
              <div className="font-medium">Informasi Privilege</div>
              <div className="text-sm text-blue-600 mt-1">
                Kelola hak akses anggota untuk berbagai fitur sistem
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clerk ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50"
              placeholder="user_xxxxxxxxx"
              value={form.clerk_id}
              onChange={(e) => setForm({...form, clerk_id: e.target.value})}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              ID unik dari Clerk untuk user yang akan diberikan privilege
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Level Privilege <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50"
              value={form.privilege}
              onChange={(e) => setForm({...form, privilege: e.target.value})}
              required
            >
              {privilegeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {privilegeOptions.find(p => p.value === form.privilege)?.description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={form.is_active}
                onChange={(e) => setForm({...form, is_active: e.target.checked})}
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Privilege aktif
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-white/20">
          <div>
            {mode === 'edit' && onDelete && (
              <GlassButton 
                variant="danger" 
                onClick={() => onDelete(privilege.id)}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Hapus Privilege
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
              disabled={!form.clerk_id || !form.privilege}
            >
              {mode === 'create' ? 'Tambah Privilege' : 'Simpan Perubahan'}
            </GlassButton>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}

export default function PrivilegesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [privileges, setPrivileges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editPrivilege, setEditPrivilege] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user?.primaryEmailAddress?.emailAddress) {
      router.push('/sign-in');
      return;
    }
    checkAdminAccess();
  }, [user, isLoaded, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchPrivileges();
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

  async function fetchPrivileges() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/privileges', {
        headers: { 'x-user-email': user?.primaryEmailAddress?.emailAddress }
      });
      if (response.ok) {
        const data = await response.json();
        setPrivileges(Array.isArray(data) ? data : []);
      } else {
        setPrivileges([]);
      }
    } catch (error) {
      console.error('Error fetching privileges:', error);
      setPrivileges([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePrivilege(form) {
    try {
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const url = modalMode === 'create' ? '/api/admin/privileges' : `/api/admin/privileges/${editPrivilege.id}`;
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': user?.primaryEmailAddress?.emailAddress
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error(`Failed to ${modalMode} privilege`);
      
      setModalOpen(false);
      setEditPrivilege(null);
      fetchPrivileges();
    } catch (error) {
      console.error('Error saving privilege:', error);
      alert(`Gagal ${modalMode === 'create' ? 'menambah' : 'mengupdate'} privilege`);
    }
  }

  async function handleDeletePrivilege(privilegeId) {
    if (!confirm('Apakah Anda yakin ingin menghapus privilege ini?')) return;
    
    try {
      const res = await fetch(`/api/admin/privileges/${privilegeId}`, { 
        method: 'DELETE',
        headers: { 'x-user-email': user?.primaryEmailAddress?.emailAddress }
      });
      if (!res.ok) throw new Error('Failed to delete privilege');
      
      setModalOpen(false);
      setEditPrivilege(null);
      fetchPrivileges();
    } catch (error) {
      console.error('Error deleting privilege:', error);
      alert('Gagal menghapus privilege');
    }
  }

  function handleCreatePrivilege() {
    setModalMode('create');
    setEditPrivilege(null);
    setModalOpen(true);
  }

  function handleEditPrivilege(privilege) {
    setModalMode('edit');
    setEditPrivilege(privilege);
    setModalOpen(true);
  }

  function handleSort(column) {
    if (sortConfig.key === column) {
      setSortConfig({
        key: column,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setSortConfig({ key: column, direction: 'asc' });
    }
  }

  function getPrivilegeBadge(privilege) {
    const variants = {
      user: 'default',
      moderator: 'info',
      admin: 'warning',
      super_admin: 'danger'
    };
    return { status: privilege.privilege, variant: variants[privilege.privilege] || 'default' };
  }

  // Filter and sort logic
  let filteredPrivileges = privileges.filter(privilege =>
    privilege.clerk_id?.toLowerCase().includes(search.toLowerCase()) ||
    privilege.privilege?.toLowerCase().includes(search.toLowerCase())
  );

  filteredPrivileges = filteredPrivileges.sort((a, b) => {
    let v1 = a[sortConfig.key] ?? '';
    let v2 = b[sortConfig.key] ?? '';
    
    if (typeof v1 === 'string') v1 = v1.toLowerCase();
    if (typeof v2 === 'string') v2 = v2.toLowerCase();
    
    if (v1 < v2) return sortConfig.direction === 'asc' ? -1 : 1;
    if (v1 > v2) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

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
          title="Kelola Privileges"
          description="Kelola hak akses dan privilege anggota komunitas"
          actions={
            <div className="flex gap-3">
              <AdminSearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari Clerk ID, privilege..."
              />
              <GlassButton 
                variant="primary" 
                onClick={handleCreatePrivilege}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Tambah Privilege
              </GlassButton>
            </div>
          }
        />
        
        <AdminContentContainer>
          <PrivilegeModal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setEditPrivilege(null);
            }}
            privilege={editPrivilege}
            onSave={handleSavePrivilege}
            onDelete={handleDeletePrivilege}
            mode={modalMode}
          />

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <div className="text-gray-600">Memuat data privileges...</div>
            </div>
          ) : filteredPrivileges.length === 0 && search ? (
            <AdminEmptyState
              title="Tidak ada hasil"
              description={`Tidak ada privilege yang cocok dengan pencarian "${search}"`}
            />
          ) : filteredPrivileges.length === 0 ? (
            <AdminEmptyState
              title="Belum ada privilege"
              description="Belum ada privilege yang terdaftar dalam sistem"
              actionText="Tambah Privilege Pertama"
              onAction={handleCreatePrivilege}
              icon={ShieldCheckIcon}
            />
          ) : (
            <AdminTableContainer>
              <AdminTableHeader>
                <AdminTableHeaderCell 
                  onClick={() => handleSort('id')} 
                  sortable 
                  sortDirection={sortConfig.key === 'id' ? sortConfig.direction : null}
                >
                  ID
                </AdminTableHeaderCell>
                <AdminTableHeaderCell 
                  onClick={() => handleSort('clerk_id')} 
                  sortable 
                  sortDirection={sortConfig.key === 'clerk_id' ? sortConfig.direction : null}
                >
                  Clerk ID
                </AdminTableHeaderCell>
                <AdminTableHeaderCell 
                  onClick={() => handleSort('privilege')} 
                  sortable 
                  sortDirection={sortConfig.key === 'privilege' ? sortConfig.direction : null}
                >
                  Privilege
                </AdminTableHeaderCell>
                <AdminTableHeaderCell>Status</AdminTableHeaderCell>
                <AdminTableHeaderCell>Dibuat</AdminTableHeaderCell>
                <AdminTableHeaderCell>Aksi</AdminTableHeaderCell>
              </AdminTableHeader>
              <AdminTableBody>
                {filteredPrivileges.map((privilege) => {
                  const badgeInfo = getPrivilegeBadge(privilege);
                  return (
                    <AdminTableRow key={privilege.id}>
                      <AdminTableCell>{privilege.id}</AdminTableCell>
                      <AdminTableCell className="font-mono text-sm">
                        {privilege.clerk_id}
                      </AdminTableCell>
                      <AdminTableCell>
                        <AdminStatusBadge 
                          status={badgeInfo.status}
                          variant={badgeInfo.variant}
                        />
                      </AdminTableCell>
                      <AdminTableCell>
                        <AdminStatusBadge 
                          status={privilege.is_active ? 'Aktif' : 'Tidak Aktif'}
                          variant={privilege.is_active ? 'success' : 'danger'}
                        />
                      </AdminTableCell>
                      <AdminTableCell className="text-sm text-gray-500">
                        {privilege.created_at ? new Date(privilege.created_at).toLocaleDateString('id-ID') : '-'}
                      </AdminTableCell>
                      <AdminTableCell>
                        <button
                          className="p-2 rounded-lg hover:bg-white/20 transition-colors text-blue-600"
                          onClick={() => handleEditPrivilege(privilege)}
                          title="Edit Privilege"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </AdminTableCell>
                    </AdminTableRow>
                  );
                })}
              </AdminTableBody>
            </AdminTableContainer>
          )}
        </AdminContentContainer>
      </AdminPageLayout>
      <ScrollToTopButton />
    </AdminLayout>
  );
}
