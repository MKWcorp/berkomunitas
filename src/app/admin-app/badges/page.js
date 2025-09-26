"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import AdminLayout from "../components/AdminLayout";
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
  // Generate shields.io URL with custom badge message
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
          // Fallback shield
          e.target.src = 'https://img.shields.io/badge/Badge-Achievement-blue?style=flat&logo=star&logoColor=white';
        }}
      />
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        <div className="font-medium">{badge.badge_name}</div>
        {badge.description && (
          <div className="text-xs text-gray-800 mt-1 max-w-48 whitespace-normal">{badge.description}</div>
        )}
        {/* Arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}

// Badge Color & Style selector for badge form
function BadgeCustomizer({ badge, onChange }) {
  const colors = [
    { name: 'Blue', value: 'blue' },
    { name: 'Green', value: 'brightgreen' },
    { name: 'Red', value: 'red' },
    { name: 'Yellow', value: 'yellow' },
    { name: 'Orange', value: 'orange' },
    { name: 'Purple', value: 'blueviolet' },
    { name: 'Pink', value: 'ff69b4' },
    { name: 'Gray', value: 'lightgrey' },
  ];

  const styles = [
    { name: 'Flat', value: 'flat' },
    { name: 'Flat Square', value: 'flat-square' },
    { name: 'For The Badge', value: 'for-the-badge' },
    { name: 'Plastic', value: 'plastic' },
    { name: 'Social', value: 'social' },
  ];

  // Generate preview URL with custom badge message
  const badgeMessage = badge.badge_message || 'Achievement';
  const previewUrl = `https://img.shields.io/badge/${encodeURIComponent(badge.badge_name || 'Preview')}-${encodeURIComponent(badgeMessage)}-${badge.badge_color}?style=${badge.badge_style}&logo=star&logoColor=white`;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preview Badge
        </label>
        <div className="p-4 border rounded-lg bg-gray-50 text-center">
          <img 
            src={previewUrl}
            alt="Badge Preview"
            className="h-6 mx-auto"
            onError={(e) => {
              e.target.src = 'https://img.shields.io/badge/Preview-Achievement-blue?style=flat&logo=star&logoColor=white';
            }}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Badge Message
        </label>
        <input
          type="text"
          value={badge.badge_message || ''}
          onChange={(e) => onChange({ ...badge, badge_message: e.target.value })}
          placeholder="Achievement"
          maxLength={50}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-800 mt-1">
          Teks yang akan muncul di badge (maks. 50 karakter)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Badge Color
        </label>
        <div className="grid grid-cols-4 gap-2">
          {colors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => onChange({ ...badge, badge_color: color.value })}
              className={`p-2 text-xs rounded border text-center transition-colors ${
                badge.badge_color === color.value 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              {color.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Badge Style
        </label>
        <div className="grid grid-cols-2 gap-2">
          {styles.map((style) => (
            <button
              key={style.value}
              type="button"
              onClick={() => onChange({ ...badge, badge_style: style.value })}
              className={`p-2 text-xs rounded border text-center transition-colors ${
                badge.badge_style === style.value 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              {style.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

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
    badge_color: "blue", // Shield color
    badge_style: "flat", // Shield style
    badge_message: "Achievement", // Badge message
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
          username: member.username || member.clerk_id || 'belum-ada-username',
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
    setForm({ badge_name: "", description: "", criteria_type: "manual", criteria_value: 0, badge_color: "blue", badge_style: "flat", badge_message: "Achievement" });
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
      badge_color: badge.badge_color || "blue",
      badge_style: badge.badge_style || "flat",
      badge_message: badge.badge_message || "Achievement",
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
      await loadMemberBadges(); // Reload member badges after badge update
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
    <AdminLayout>
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
                <th className="px-4 py-2 border-b text-left cursor-pointer select-none" onClick={() => handleSort("badge_name")}>Badge {sortConfig.key === "badge_name" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}</th>
                <th className="px-4 py-2 border-b text-center cursor-pointer select-none" onClick={() => handleSort("criteria_type")}>Tipe Kriteria {sortConfig.key === "criteria_type" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}</th>
                <th className="px-4 py-2 border-b text-center cursor-pointer select-none" onClick={() => handleSort("criteria_value")}>Nilai {sortConfig.key === "criteria_value" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}</th>
                <th className="px-4 py-2 border-b text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedBadges.map((badge) => (
                <tr key={badge.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{badge.id}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <BadgeShield badge={badge} size="h-5" />
                      <div>
                        <div className="font-medium">{badge.badge_name}</div>
                        <div className="text-sm text-gray-800">{badge.description}</div>
                      </div>
                    </div>
                  </td>
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
            <h2 className="text-xl font-semibold text-gray-900">Kelola Lencana Member</h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari member atau username..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="block w-80 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>
            <button
              onClick={openBatchModal}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <UserGroupIcon className="w-4 h-4" />
              Berikan Lencana Massal
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4">Memuat data member...</div>
        ) : members.length === 0 ? (
          <div className="text-center py-4 text-gray-800">Belum ada member yang terdaftar</div>
        ) : filteredMembers.length === 0 && searchMember ? (
          <div className="text-center py-8 text-gray-800">
            <MagnifyingGlassIcon className="w-12 h-12 mx-auto text-gray-600 mb-2" />
            <p>Tidak ada member yang ditemukan untuk "{searchMember}"</p>
          </div>
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
                {filteredMembers.map((member) => {
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
                            <div className="text-sm text-gray-700">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-800">@{member.username || 'belum-ada-username'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {memberBadgesList.length === 0 ? (
                            <span className="text-sm text-gray-700 italic">Belum memiliki lencana</span>
                          ) : (
                            memberBadgesList.map((badge) => (
                              <div key={badge.id} className="relative group">
                                <div className="flex items-center gap-1 p-1 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                                  <BadgeShield badge={badge} size="h-4" />
                                  <button
                                    onClick={() => handleRemoveMemberBadge(member.id, badge.id)}
                                    className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Hapus lencana"
                                  >
                                    <XMarkIcon className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-gray-800">
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
                    <div className="text-xs text-gray-700">@{member.username || 'belum-ada-username'}</div>
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
          
          {/* Badge customizer */}
          <BadgeCustomizer 
            badge={form}
            onChange={setForm}
          />
          
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
    </AdminLayout>
  );
}
