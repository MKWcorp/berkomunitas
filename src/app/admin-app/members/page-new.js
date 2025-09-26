"use client";
import { useState, useEffect } from "react";
import { ChevronUpIcon, ChevronDownIcon, PencilIcon } from "@heroicons/react/24/outline";
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
  AdminEmptyState
} from '@/components/AdminComponents';
import { GlassCard, GlassButton } from '@/components/GlassLayout';
import AdminModal from '../components/AdminModal';
import ScrollToTopButton from '../components/ScrollToTopButton';

function EditMemberModal({ open, onClose, member, onSave, position }) {
  const [form, setForm] = useState(member || {});
  useEffect(() => { setForm(member || {}); }, [member]);
  
  return (
    <AdminModal
      isOpen={open}
      onClose={onClose}
      title="Edit Data Member"
      maxWidth="max-w-xl"
      position={position}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          <GlassCard className="p-4 mb-6">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Info:</span> Silakan ubah data member di bawah ini, lalu klik Simpan untuk menyimpan perubahan.
            </p>
          </GlassCard>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input 
                className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50" 
                placeholder="Masukkan nama lengkap" 
                value={form.nama_lengkap||''} 
                onChange={e=>setForm(f=>({...f,nama_lengkap:e.target.value}))} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input 
                className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50" 
                placeholder="Masukkan username" 
                value={form.username||''} 
                onChange={e=>setForm(f=>({...f,username:e.target.value}))} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input 
                type="email"
                className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50" 
                placeholder="Masukkan email" 
                value={form.email||''} 
                onChange={e=>setForm(f=>({...f,email:e.target.value}))} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                No WhatsApp
              </label>
              <input 
                type="tel"
                className="w-full backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50" 
                placeholder="Contoh: 08123456789" 
                value={form.no_wa||''} 
                onChange={e=>setForm(f=>({...f,no_wa:e.target.value}))} 
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/20">
          <GlassButton variant="secondary" onClick={onClose}>
            Batal
          </GlassButton>
          <GlassButton variant="primary" onClick={()=>onSave(form)}>
            Simpan Perubahan
          </GlassButton>
        </div>
      </div>
    </AdminModal>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("asc");
  const [editMember, setEditMember] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/members");
      if (!res.ok) throw new Error("Gagal memuat data member");
      const data = await res.json();
      setMembers(Array.isArray(data.members) ? data.members : []);
    } catch (err) {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdit(form) {
    try {
      const res = await fetch(`/api/admin/members/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setModalOpen(false);
        setEditMember(null);
        setModalPosition(null);
        fetchMembers();
      } else {
        alert('Gagal update member');
      }
    } catch (err) {
      alert('Gagal update member');
    }
  }

  function handleOpenEditModal(member, event) {
    if (event) {
      const rect = event.target.getBoundingClientRect();
      setModalPosition({
        top: rect.bottom + window.scrollY + 8,
        left: Math.min(rect.left + window.scrollX, window.innerWidth - 400)
      });
    }
    setEditMember(member);
    setModalOpen(true);
  }

  function handleSort(column) {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  }

  // Search & Sort logic
  let filtered = Array.isArray(members)
    ? members.filter((m) => {
        const q = search.toLowerCase();
        return (
          String(m.id).includes(q) ||
          (m.nama_lengkap && m.nama_lengkap.toLowerCase().includes(q)) ||
          (m.email && m.email.toLowerCase().includes(q)) ||
          (m.nomer_wa && m.nomer_wa.toLowerCase().includes(q)) ||
          (m.username && m.username.toLowerCase().includes(q))
        );
      })
    : [];

  // Sort
  filtered = filtered.sort((a, b) => {
    let v1 = a[sortBy] ?? '';
    let v2 = b[sortBy] ?? '';
    
    // Handle special cases for nested data
    if (sortBy === 'email') {
      v1 = Array.isArray(a.member_emails) && a.member_emails.length > 0 ? a.member_emails[0].email : (a.email || '');
      v2 = Array.isArray(b.member_emails) && b.member_emails.length > 0 ? b.member_emails[0].email : (b.email || '');
    } else if (sortBy === 'nomer_wa') {
      v1 = a.nomer_wa ?? a.no_wa ?? '';
      v2 = b.nomer_wa ?? b.no_wa ?? '';
    }
    
    if (typeof v1 === 'string') v1 = v1.toLowerCase();
    if (typeof v2 === 'string') v2 = v2.toLowerCase();
    if (v1 < v2) return sortDir === 'asc' ? -1 : 1;
    if (v1 > v2) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <AdminLayout>
      <AdminPageLayout>
        <AdminPageHeader 
          title="Kelola Member"
          description="Kelola data anggota komunitas"
          actions={
            <AdminSearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email, WA..."
            />
          }
        />
        
        <AdminContentContainer>
          <EditMemberModal
            open={modalOpen}
            onClose={() => { setModalOpen(false); setEditMember(null); setModalPosition(null); }}
            member={editMember}
            onSave={handleSaveEdit}
            position={modalPosition}
          />
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <div className="text-gray-600">Memuat data member...</div>
            </div>
          ) : filtered.length === 0 && search ? (
            <AdminEmptyState
              title="Tidak ada hasil"
              description={`Tidak ada member yang cocok dengan pencarian "${search}"`}
            />
          ) : filtered.length === 0 ? (
            <AdminEmptyState
              title="Belum ada member"
              description="Belum ada member yang terdaftar dalam sistem"
            />
          ) : (
            <AdminTableContainer>
              <AdminTableHeader>
                <AdminTableHeaderCell 
                  onClick={() => handleSort('id')} 
                  sortable 
                  sortDirection={sortBy === 'id' ? sortDir : null}
                >
                  ID
                </AdminTableHeaderCell>
                <AdminTableHeaderCell 
                  onClick={() => handleSort('nama_lengkap')} 
                  sortable 
                  sortDirection={sortBy === 'nama_lengkap' ? sortDir : null}
                >
                  Nama Lengkap
                </AdminTableHeaderCell>
                <AdminTableHeaderCell>Email</AdminTableHeaderCell>
                <AdminTableHeaderCell 
                  onClick={() => handleSort('username')} 
                  sortable 
                  sortDirection={sortBy === 'username' ? sortDir : null}
                >
                  Username
                </AdminTableHeaderCell>
                <AdminTableHeaderCell 
                  onClick={() => handleSort('nomer_wa')} 
                  sortable 
                  sortDirection={sortBy === 'nomer_wa' ? sortDir : null}
                >
                  WA
                </AdminTableHeaderCell>
                <AdminTableHeaderCell>Aksi</AdminTableHeaderCell>
              </AdminTableHeader>
              <AdminTableBody>
                {filtered.map((m) => (
                  <AdminTableRow key={m.id}>
                    <AdminTableCell>{m.id}</AdminTableCell>
                    <AdminTableCell>{m.nama_lengkap}</AdminTableCell>
                    <AdminTableCell>
                      {Array.isArray(m.member_emails) && m.member_emails.length > 0 
                        ? m.member_emails[0].email 
                        : (m.email || '-')
                      }
                    </AdminTableCell>
                    <AdminTableCell>{m.username || '-'}</AdminTableCell>
                    <AdminTableCell>{m.nomer_wa || m.no_wa || '-'}</AdminTableCell>
                    <AdminTableCell>
                      <button
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors text-blue-600"
                        onClick={(e) => handleOpenEditModal(m, e)}
                        title="Edit Member"
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
