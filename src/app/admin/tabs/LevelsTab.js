'use client';
import { useState, useEffect } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import AdminModal from '../components/AdminModal';
import ScrollToTopButton from '../components/ScrollToTopButton';

export default function LevelsTab() {
  const { user } = useSSOUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    level_number: '',
    level_name: '',
    required_points: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: 'level_number', direction: 'asc' });

  useEffect(() => {
    if (user && user.email) {
      fetchItems();
    }
  }, [user]);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/admin/levels', {
        headers: { 'x-user-email': user?.email }
      });
      if (response.ok) {
        const data = await response.json();
        setItems(Array.isArray(data) ? data : []);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching levels:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/admin/levels/${editingItem.id}` : '/api/admin/levels';
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email
        },
        body: JSON.stringify({
          level_number: parseInt(formData.level_number),
          level_name: formData.level_name,
          required_points: parseInt(formData.required_points)
        })
      });

      if (response.ok) {
        fetchItems();
        closeModal();
      } else {
        alert('Error saving level');
      }
    } catch (error) {
      console.error('Error saving level:', error);
      alert('Error saving level');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus level ini?')) return;
    
    try {
      const response = await fetch(`/api/admin/levels/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': user?.email }
      });

      if (response.ok) {
        fetchItems();
      } else {
        alert('Error deleting level');
      }
    } catch (error) {
      console.error('Error deleting level:', error);
      alert('Error deleting level');
    }
  };

  const openModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({
        level_number: item.level_number?.toString() || '',
        level_name: item.level_name || '',
        required_points: item.required_points?.toString() || ''
      });
    } else {
      setFormData({
        level_number: '',
        level_name: '',
        required_points: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      level_number: '',
      level_name: '',
      required_points: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Memuat data levels...</div>
      </div>
    );
  }

  // Sorting logic
  let sortedItems = Array.isArray(items) ? [...items] : [];
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manajemen Level</h2>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Tambah Level
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('level_number')}>
                Level Number {sortConfig.key === 'level_number' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('level_name')}>
                Nama Level {sortConfig.key === 'level_name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('required_points')}>
                Poin Dibutuhkan {sortConfig.key === 'required_points' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedItems.map((item) => (
              <tr key={item.level_number} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">Level {item.level_number}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.level_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.required_points?.toLocaleString()} Poin</div>
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
                      onClick={() => handleDelete(item.level_number)}
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

        {items.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">Belum ada data level</div>
          </div>
        )}
      </div>

      {/* Modal using AdminModal component */}
      <AdminModal
        isOpen={showModal}
        onClose={closeModal}
        title={editingItem ? 'Edit Level' : 'Tambah Level Baru'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level Number
            </label>
            <input
              type="number"
              value={formData.level_number}
              onChange={(e) => setFormData({ ...formData, level_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Level
            </label>
            <input
              type="text"
              value={formData.level_name}
              onChange={(e) => setFormData({ ...formData, level_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Poin Dibutuhkan
            </label>
            <input
              type="number"
              value={formData.required_points}
              onChange={(e) => setFormData({ ...formData, required_points: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
            />
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

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  );
}
