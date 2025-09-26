"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
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

export default function BadgesTab() {
  const { user } = useUser();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editBadge, setEditBadge] = useState(null);
  const [modalPosition, setModalPosition] = useState(null);
  const [form, setForm] = useState({
    badge_name: "",
    description: "",
    criteria_type: "manual",
    criteria_value: 0,
  });
  const [saving, setSaving] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

  // States for member badges management
  const [members, setMembers] = useState([]);
  const [memberBadges, setMemberBadges] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedBadgeForBatch, setSelectedBadgeForBatch] = useState(null);
  const [selectedMembersForBatch, setSelectedMembersForBatch] = useState([]);
  const [searchMember, setSearchMember] = useState('');
  const [memberBadgeLoading, setMemberBadgeLoading] = useState(false);

  useEffect(() => {
    loadBadges();
    loadMembers();
    loadMemberBadges();
    // eslint-disable-next-line
  }, [user]);
  async function loadBadges() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/badges", {
        headers: {
          ...(user?.primaryEmailAddress?.emailAddress ? { "x-user-email": user.primaryEmailAddress.emailAddress } : {})
        }
      });
      if (!res.ok) throw new Error("Gagal memuat data lencana");
      const data = await res.json();
      setBadges(data.badges || data); // Handle both formats
    } catch (err) {
      setError(err.message || "Gagal memuat data lencana");
    } finally {
      setLoading(false);
    }
  }
  async function loadMembers() {
    try {
      const res = await fetch("/api/admin/members", {
        headers: {
          ...(user?.primaryEmailAddress?.emailAddress ? { "x-user-email": user.primaryEmailAddress.emailAddress } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        // Map members data to match expected format
        const mappedMembers = data.members.map(member => ({
          id: member.id,
          name: member.nama_lengkap || 'Nama tidak tersedia',
          username: member.username || 'belum-ada-username',
          email: member.email || 'Email tidak tersedia'
        }));
        setMembers(mappedMembers);
      } else {
        console.error('Members API Error:', res.status, await res.text());
      }
    } catch (err) {
      console.error("Error loading members:", err);
    }
  }  async function loadMemberBadges() {
    console.log('🔄 Loading member badges...');
    setMemberBadgeLoading(true);
    try {
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      console.log('👤 User email for auth:', userEmail);
      
      const headers = {
        ...(userEmail ? { "x-user-email": userEmail } : {})
      };
      console.log('📤 Request headers:', headers);
      
      const res = await fetch("/api/admin/member-badges", { headers });
      console.log('📥 Response status:', res.status);
      console.log('📥 Response ok:', res.ok);
      
      if (res.ok) {
        const data = await res.json();
        console.log('📊 Member badges API response:', data);
        
        // Map member badges data to match expected format
        const mappedMemberBadges = data.memberBadges.map(mb => ({
          id: mb.id,
          member_id: mb.id_member,
          badge_id: mb.id_badge,
          earned_date: mb.earned_at,
          member: {
            id: mb.members.id,
            name: mb.members.nama_lengkap || 'Nama tidak tersedia',
            clerk_id: mb.members.clerk_id
          },
          badge: mb.badges
        }));
        console.log('🗺️ Mapped member badges:', mappedMemberBadges);
        setMemberBadges(mappedMemberBadges);
      } else {
        const errorText = await res.text();
        console.error('❌ API Error:', res.status, errorText);
      }
    } catch (err) {
      console.error("❌ Error loading member badges:", err);
    } finally {
      setMemberBadgeLoading(false);
    }
  }

  function openAddModal(event = null) {
    if (event) {
      setModalPosition({
        top: event.clientY,
        left: event.clientX
      });
    } else {
      setModalPosition(null);
    }
    setEditBadge(null);
    setForm({ badge_name: "", description: "", criteria_type: "manual", criteria_value: 0 });
    setShowModal(true);
  }

  function openEditModal(badge, event = null) {
    if (event) {
      setModalPosition({
        top: event.clientY,
        left: event.clientX
      });
    } else {
      setModalPosition(null);
    }
    setEditBadge(badge);
    setForm({
      badge_name: badge.badge_name,
      description: badge.description,
      criteria_type: badge.criteria_type,
      criteria_value: badge.criteria_value,
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const method = editBadge ? "PUT" : "POST";
      const url = editBadge ? `/api/admin/badges/${editBadge.id}` : "/api/admin/badges";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(user?.primaryEmailAddress?.emailAddress ? { "x-user-email": user.primaryEmailAddress.emailAddress } : {}),
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan lencana");
      }
      setShowModal(false);
      await loadBadges();
    } catch (err) {
      setError(err.message || "Gagal menyimpan lencana");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Yakin ingin menghapus lencana ini?")) return;
    if (!user?.primaryEmailAddress?.emailAddress) return;
    try {
      const res = await fetch(`/api/admin/badges/${id}`, {
        method: "DELETE",
        headers: { "x-user-email": user.primaryEmailAddress.emailAddress },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menghapus lencana");
      }
      await loadBadges();
      await loadMemberBadges(); // Reload member badges after badge deletion
    } catch (err) {
      alert(err.message || "Gagal menghapus lencana");
    }
  }

  // Member Badge Management Functions
  async function handleBatchGrantBadge() {
    if (!selectedBadgeForBatch || selectedMembersForBatch.length === 0) {
      alert('Pilih lencana dan minimal satu member');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/member-badges/batch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(user?.primaryEmailAddress?.emailAddress ? { "x-user-email": user.primaryEmailAddress.emailAddress } : {})
        },
        body: JSON.stringify({
          badgeId: selectedBadgeForBatch,
          memberIds: selectedMembersForBatch
        })
      });

      if (!res.ok) throw new Error('Gagal memberikan lencana');
      
      await loadMemberBadges();
      setShowBatchModal(false);
      setSelectedBadgeForBatch(null);
      setSelectedMembersForBatch([]);
      setSearchMember('');
    } catch (err) {
      alert(err.message || 'Gagal memberikan lencana');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveMemberBadge(memberId, badgeId) {
    if (!confirm('Yakin ingin menghapus lencana dari member ini?')) return;
    if (!user?.primaryEmailAddress?.emailAddress) return;

    try {
      const res = await fetch(`/api/admin/member-badges/remove/${memberId}/${badgeId}`, {
        method: 'DELETE',
        headers: { "x-user-email": user.primaryEmailAddress.emailAddress }
      });

      if (!res.ok) throw new Error('Gagal menghapus lencana member');
      await loadMemberBadges();
    } catch (err) {
      alert(err.message || 'Gagal menghapus lencana member');
    }
  }

  function openBatchModal() {
    setShowBatchModal(true);
    setSelectedBadgeForBatch(null);
    setSelectedMembersForBatch([]);
    setSearchMember('');
  }

  function toggleMemberSelection(memberId) {
    setSelectedMembersForBatch(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  }

  // Sorting logic
  let sortedBadges = Array.isArray(badges) ? [...badges] : [];
  if (sortConfig.key) {
    sortedBadges.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }
  
  // Filter and process members
  const filteredMembers = members.filter(member => 
    member.name?.toLowerCase().includes(searchMember.toLowerCase()) ||
    member.username?.toLowerCase().includes(searchMember.toLowerCase())
  );  // Group member badges by member
  const memberBadgeMap = {};
  memberBadges.forEach(mb => {
    if (!memberBadgeMap[mb.member_id]) {
      memberBadgeMap[mb.member_id] = [];
    }
    memberBadgeMap[mb.member_id].push(mb.badge);
  });
  
  console.log('Member badge map:', memberBadgeMap); // Debug log
  console.log('Members array:', members); // Debug log

  function handleSort(key) {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Kelola Lencana</h2>
        <button
          onClick={(e) => openAddModal(e)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Tambah Lencana
        </button>
      </div>

      {error && <div className="text-center text-red-500 py-8">{error}</div>}
      {loading ? (
        <div className="text-center py-8">Memuat data lencana...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border-b text-left cursor-pointer select-none" onClick={() => handleSort("id")}>ID {sortConfig.key === "id" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}</th>
                <th className="px-4 py-2 border-b text-left cursor-pointer select-none" onClick={() => handleSort("badge_name")}>Nama Lencana {sortConfig.key === "badge_name" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}</th>
                <th className="px-4 py-2 border-b text-left cursor-pointer select-none" onClick={() => handleSort("description")}>Deskripsi {sortConfig.key === "description" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}</th>
                <th className="px-4 py-2 border-b text-center cursor-pointer select-none" onClick={() => handleSort("criteria_type")}>Tipe Kriteria {sortConfig.key === "criteria_type" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}</th>
                <th className="px-4 py-2 border-b text-center cursor-pointer select-none" onClick={() => handleSort("criteria_value")}>Nilai {sortConfig.key === "criteria_value" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}</th>
                <th className="px-4 py-2 border-b text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedBadges.map((badge) => (
                <tr key={badge.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{badge.id}</td>
                  <td className="px-4 py-2 font-medium">{badge.badge_name}</td>
                  <td className="px-4 py-2">{badge.description}</td>
                  <td className="px-4 py-2 text-center">
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                      {badge.criteria_type === "manual"
                        ? "Manual"
                        : badge.criteria_type === "loyalty_points"
                        ? "Loyalty Points"
                        : badge.criteria_type === "tasks_completed"
                        ? "Tugas Selesai"
                        : badge.criteria_type === "comments_count"
                        ? "Jumlah Komentar"
                        : "Manual"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">{badge.criteria_value || 0}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={(e) => openEditModal(badge, e)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                        title="Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(badge.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                        title="Hapus"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Member Badges Management Section */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-800">Kelola Lencana Member</h2>
          </div>
          <button
            onClick={openBatchModal}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <UserGroupIcon className="w-4 h-4" />
            Berikan Lencana Massal
          </button>
        </div>

        {loading ? (
          <div className="text-center py-4">Memuat data member...</div>
        ) : members.length === 0 ? (
          <div className="text-center py-4 text-gray-500">Belum ada member yang terdaftar</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-purple-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Member</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Username</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Lencana yang Dimiliki</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {members.map((member) => {
                  const memberBadgesList = memberBadgeMap[member.id] || [];
                  return (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 text-sm font-medium">
                              {member.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{member.name || 'Nama tidak tersedia'}</div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">@{member.username || 'belum-ada-username'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {memberBadgesList.length === 0 ? (
                            <span className="text-sm text-gray-400 italic">Belum memiliki lencana</span>
                          ) : (
                            memberBadgesList.map((badge) => (
                              <div
                                key={badge.id}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                              >
                                <span>{badge.badge_name}</span>
                                <button
                                  onClick={() => handleRemoveMemberBadge(member.id, badge.id)}
                                  className="text-blue-600 hover:text-red-600 ml-1"
                                  title="Hapus lencana"
                                >
                                  <XMarkIcon className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-gray-600">
                          {memberBadgesList.length} lencana
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Batch Grant Badge Modal */}
      <AdminModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        title="Berikan Lencana Massal"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Badge Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Pilih Lencana</label>
            <select
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={selectedBadgeForBatch || ''}
              onChange={(e) => setSelectedBadgeForBatch(Number(e.target.value) || null)}
            >
              <option value="">-- Pilih Lencana --</option>
              {badges.map((badge) => (
                <option key={badge.id} value={badge.id}>
                  {badge.badge_name}
                </option>
              ))}
            </select>
          </div>

          {/* Member Search */}
          <div>
            <label className="block text-sm font-medium mb-2">Cari Member</label>
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau username..."
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
            />
          </div>

          {/* Member Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Pilih Member ({selectedMembersForBatch.length} dipilih)
            </label>
            <div className="border rounded max-h-60 overflow-y-auto">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 p-3 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedMembersForBatch.includes(member.id) ? 'bg-purple-50' : ''
                  }`}
                  onClick={() => toggleMemberSelection(member.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedMembersForBatch.includes(member.id)}
                    onChange={() => {}}
                    className="rounded text-purple-600"
                  />
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm font-medium">
                      {member.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{member.name || 'Nama tidak tersedia'}</div>
                    <div className="text-xs text-gray-500">@{member.username || 'belum-ada-username'}</div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {(memberBadgeMap[member.id] || []).length} lencana
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            onClick={() => setShowBatchModal(false)}
            disabled={saving}
          >
            Batal
          </button>
          <button
            onClick={handleBatchGrantBadge}
            className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-400"
            disabled={saving || !selectedBadgeForBatch || selectedMembersForBatch.length === 0}
          >
            {saving ? "Memberikan..." : `Berikan ke ${selectedMembersForBatch.length} Member`}
          </button>
        </div>
      </AdminModal>

      {/* Badge CRUD Modal */}
      <AdminModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editBadge ? "Edit Lencana" : "Tambah Lencana"}
        maxWidth="max-w-md"
        position={modalPosition}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Lencana</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={form.badge_name}
              onChange={(e) => setForm((f) => ({ ...f, badge_name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deskripsi</label>
            <textarea
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipe Kriteria</label>
            <select
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={form.criteria_type}
              onChange={(e) => setForm((f) => ({ ...f, criteria_type: e.target.value }))}
            >
              <option value="manual">Manual</option>
              <option value="loyalty_points">Loyalty Points</option>
              <option value="tasks_completed">Tugas Selesai</option>
              <option value="comments_count">Jumlah Komentar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nilai Kriteria</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={form.criteria_value}
              onChange={(e) => setForm((f) => ({ ...f, criteria_value: Number(e.target.value) }))}
              min={0}
              required
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              onClick={() => setShowModal(false)}
              disabled={saving}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              disabled={saving}
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
