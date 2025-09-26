'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { PencilIcon, TrashIcon, PlusIcon, UserIcon } from '@heroicons/react/24/outline';
import AdminModal from '../components/AdminModal';

export default function PrivilegesTab() {
  const { user } = useUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    clerk_id: '',
    privilege: 'user',
    is_active: true
  });
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [search, setSearch] = useState('');

  const privileges = [
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'super_admin', label: 'Super Admin' }
  ];

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/admin/privileges', {
        headers: { 'x-user-email': user?.primaryEmailAddress?.emailAddress }
      });
      if (response.ok) {
        const data = await response.json();
        setItems(Array.isArray(data) ? data : []);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching privileges:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/admin/privileges/${editingItem.id}` : '/api/admin/privileges';
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.primaryEmailAddress?.emailAddress
        },
        body: JSON.stringify({
          clerk_id: formData.clerk_id,
          privilege: formData.privilege,
          is_active: formData.is_active
        })
      });

      if (response.ok) {
        fetchItems();
        closeModal();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error saving privilege');
      }
    } catch (error) {
      console.error('Error saving privilege:', error);
      alert('Error saving privilege');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus privilege ini?')) return;
    
    try {
      const response = await fetch(`/api/admin/privileges/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': user?.primaryEmailAddress?.emailAddress }
      });

      if (response.ok) {
        fetchItems();
      } else {
        alert('Error deleting privilege');
      }
    } catch (error) {
      console.error('Error deleting privilege:', error);
      alert('Error deleting privilege');
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/privileges/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.primaryEmailAddress?.emailAddress
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (response.ok) {
        fetchItems();
      } else {
        alert('Error updating privilege status');
      }
    } catch (error) {
      console.error('Error updating privilege status:', error);
      alert('Error updating privilege status');
    }
  };

  const openModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({
        clerk_id: item.clerk_id || '',
        privilege: item.privilege || 'user',
        is_active: item.is_active !== false
      });
    } else {
      setFormData({
        clerk_id: '',
        privilege: 'user',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      clerk_id: '',
      privilege: 'user',
      is_active: true
    });
  };

  const getPrivilegeLabel = (privilege) => {
    const privilegeObj = privileges.find(r => r.value === privilege);
    return privilegeObj ? privilegeObj.label : privilege;
  };

  const getPrivilegeBadgeColor = (privilege) => {
    switch (privilege) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Search & Sorting logic
  let filteredItems = Array.isArray(items) ? items.filter(item => {
    const q = search.toLowerCase();
    return (
      String(item.id).includes(q) ||
      (item.members?.nama_lengkap && item.members.nama_lengkap.toLowerCase().includes(q)) ||
      (item.clerk_id && item.clerk_id.toLowerCase().includes(q)) ||
      (item.members?.member_emails?.[0]?.email && item.members.member_emails[0].email.toLowerCase().includes(q)) ||
      (item.privilege && item.privilege.toLowerCase().includes(q)) ||
      (item.is_active ? 'aktif' : 'nonaktif').includes(q)
    );
  }) : [];
  let sortedItems = [...filteredItems];
  if (sortConfig.key) {
    sortedItems.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }
  function handleSort(key) {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Memuat data privileges...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Manajemen Privileges</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            type="text"
            className="border rounded px-3 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Cari user, email, privilege, status, ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Tambah Privilege
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('id')}>
                ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('members.nama_lengkap')}>
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('members.member_emails.0.email')}>
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('privilege')}>
                Privilege {sortConfig.key === 'privilege' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('is_active')}>
                Status {sortConfig.key === 'is_active' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('granted_at')}>
                Dibuat {sortConfig.key === 'granted_at' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.members?.nama_lengkap || item.clerk_id || 'Unknown User'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {Array.isArray(item.members?.member_emails) ? (item.members.member_emails[0]?.email || '-') : (typeof item.members?.member_emails === 'string' ? item.members.member_emails : '-')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPrivilegeBadgeColor(item.privilege)}`}>
                    {typeof item.privilege === 'string' ? getPrivilegeLabel(item.privilege) : JSON.stringify(item.privilege)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleActive(item.id, item.is_active)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {typeof item.granted_at === 'string' ? item.granted_at.replace('T', ' ').slice(0, 19) : (item.granted_at ? new Date(item.granted_at).toLocaleDateString('id-ID') : '-')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(item)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">Belum ada data privileges</div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AdminModal
        isOpen={showModal}
        onClose={closeModal}
        title={editingItem ? 'Edit Privilege' : 'Tambah Privilege Baru'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clerk ID
            </label>
            <input
              type="text"
              value={formData.clerk_id}
              onChange={(e) => setFormData({ ...formData, clerk_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Masukkan Clerk ID user..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Privilege Level
            </label>
            <select
              value={formData.privilege}
              onChange={(e) => setFormData({ ...formData, privilege: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Privilege aktif
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {editingItem ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
