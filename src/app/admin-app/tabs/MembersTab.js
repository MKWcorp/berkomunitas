"use client";
import { useState, useEffect } from "react";
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
        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Info:</span> Silakan ubah data member di bawah ini, lalu klik Simpan untuk menyimpan perubahan.
            </p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input 
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" 
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
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" 
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
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" 
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
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" 
                placeholder="Contoh: 08123456789" 
                value={form.no_wa||''} 
                onChange={e=>setForm(f=>({...f,no_wa:e.target.value}))} 
              />
            </div>
          </div>
        </div>
        
        {/* Action Buttons - Fixed at bottom */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t-2 border-gray-200 bg-gray-50 -mx-6 px-6 py-4 rounded-b-lg">
          <button 
            className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition-colors border border-gray-300" 
            onClick={onClose}
          >
            Batal
          </button>
          <button 
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-md hover:shadow-lg" 
            onClick={()=>onSave(form)}
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </AdminModal>
  );
}

export default function MembersTab() {
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
      setModalPosition({
        top: event.clientY,
        left: event.clientX
      });
    } else {
      setModalPosition(null);
    }
    setEditMember(member);
    setModalOpen(true);
  }

  async function handleDelete(id) {
    if (!window.confirm('Yakin ingin menghapus member ini?')) return;
    const res = await fetch(`/api/admin/members/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      fetchMembers();
    } else {
      alert('Gagal menghapus member');
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
          (m.nomer_wa && m.nomer_wa.toLowerCase().includes(q))
        );
      })
    : [];

  // Sort
  filtered = filtered.sort((a, b) => {
    let v1 = a[sortBy] ?? '';
    let v2 = b[sortBy] ?? '';
    if (typeof v1 === 'string') v1 = v1.toLowerCase();
    if (typeof v2 === 'string') v2 = v2.toLowerCase();
    if (v1 < v2) return sortDir === 'asc' ? -1 : 1;
    if (v1 > v2) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  function handleSort(column) {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  }

  function getSortIcon(column) {
    if (sortBy !== column) return ' ↕';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  }

  return (
    <div className="p-6">
      <EditMemberModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditMember(null); setModalPosition(null); }}
        member={editMember}
        onSave={handleSaveEdit}
        position={modalPosition}
      />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Kelola Member</h2>
        <input
          type="text"
          className="border rounded px-3 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Cari nama, email, WA..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('id')}
              >
                ID{getSortIcon('id')}
              </th>
              <th 
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('nama_lengkap')}
              >
                Nama{getSortIcon('nama_lengkap')}
              </th>
              <th 
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('email')}
              >
                Email{getSortIcon('email')}
              </th>
              <th 
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('username')}
              >
                Username{getSortIcon('username')}
              </th>
              <th 
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('nomer_wa')}
              >
                WA{getSortIcon('nomer_wa')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{m.id}</td>
                <td className="px-4 py-2">{m.nama_lengkap}</td>
                <td className="px-4 py-2">{Array.isArray(m.member_emails) && m.member_emails.length > 0 ? m.member_emails[0].email : (m.email||'')}</td>
                <td className="px-4 py-2">{m.username ?? ''}</td>
                <td className="px-4 py-2">{m.nomer_wa ?? m.no_wa ?? ''}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button className="px-2 py-1 bg-yellow-400 rounded text-xs text-white" onClick={(e) => handleOpenEditModal(m, e)}>
                    Edit
                  </button>
                  <button className="px-2 py-1 bg-red-500 rounded text-xs text-white" onClick={()=>handleDelete(m.id)}>
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">Belum ada data member</div>
        )}
        {loading && (
          <div className="text-center py-12 text-gray-500">Memuat data member...</div>
        )}
      </div>

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  );
}
