 'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { PencilIcon, TrashIcon, PlusIcon, EyeIcon, MagnifyingGlassIcon, XMarkIcon, ShareIcon } from '@heroicons/react/24/outline';
import AdminModal from '../components/AdminModal';
import ScrollToTopButton from '../components/ScrollToTopButton';

export default function TasksTab() {
  const { user } = useUser();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalPosition, setModalPosition] = useState(null);
  const [formData, setFormData] = useState({
    keyword_tugas: '',
    deskripsi_tugas: '',
    link_postingan: '',
    point_value: '',
    status: 'tersedia'
  });
  const [sortConfig, setSortConfig] = useState({ key: 'post_timestamp', direction: 'desc' });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const statusOptions = [
    { value: 'tersedia', label: 'Tersedia' },
    { value: 'tidak_tersedia', label: 'Tidak Tersedia' },
    { value: 'selesai', label: 'Selesai' }
  ];

  // Helper function untuk format URL agar lebih readable
  const formatUrl = (url) => {
    if (!url) return '-';
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      const path = urlObj.pathname.length > 20 ? urlObj.pathname.substring(0, 20) + '...' : urlObj.pathname;
      return `${domain}${path}`;
    } catch {
      // Jika URL tidak valid, tampilkan sebagian dari string
      return url.length > 30 ? url.substring(0, 30) + '...' : url;
    }
  };

  // Helper function untuk format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
  }, [search]);

  useEffect(() => {
    fetchItems(page);
    // eslint-disable-next-line
  }, [page, search]);

  const fetchItems = async (pageNum = 1) => {
    if (!hasMore && pageNum !== 1) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/tugas?page=${pageNum}&q=${encodeURIComponent(search)}`, {
        headers: { 'x-user-email': user?.primaryEmailAddress?.emailAddress }
      });
      if (response.ok) {
        const result = await response.json();
        const newTasks = Array.isArray(result.tasks) ? result.tasks : [];
        setItems(prev => pageNum === 1 ? newTasks : [...prev, ...newTasks]);
        setHasMore(newTasks.length > 0);
      } else {
        if (pageNum === 1) setItems([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      if (pageNum === 1) setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Infinite scroll observer
  const lastTaskElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/admin/tugas/${editingItem.id}` : '/api/admin/tugas';
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.primaryEmailAddress?.emailAddress
        },
        body: JSON.stringify({
          keyword_tugas: formData.keyword_tugas,
          deskripsi_tugas: formData.deskripsi_tugas,
          link_postingan: formData.link_postingan,
          point_value: parseInt(formData.point_value) || 10,
          status: formData.status
        })
      });

      if (response.ok) {
        fetchItems();
        closeModal();
      } else {
        alert('Error saving task');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Error saving task');
    }
  };

  const handleDelete = async (id, forceDelete = false) => {
    const confirmMessage = forceDelete 
      ? 'Yakin ingin menghapus tugas ini BESERTA SEMUA SUBMISSION terkait? Tindakan ini tidak dapat dibatalkan!' 
      : 'Yakin ingin menghapus tugas ini?';
      
    if (!confirm(confirmMessage)) return;
    
    try {
      const url = forceDelete ? `/api/admin/tugas/${id}?force=true` : `/api/admin/tugas/${id}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'x-user-email': user?.primaryEmailAddress?.emailAddress }
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || 'Tugas berhasil dihapus');
        fetchItems();
      } else {
        const errorResult = await response.json();
        if (errorResult.hasSubmissions && !forceDelete) {
          const forceDeleteConfirm = confirm(
            `❌ ${errorResult.message}\n\nApakah Anda ingin menghapus tugas beserta ${errorResult.submissionCount} submission terkait?\n\n⚠️ PERINGATAN: Tindakan ini akan menghapus semua data submission dan tidak dapat dibatalkan!`
          );
          
          if (forceDeleteConfirm) {
            // Recursive call with force delete
            handleDelete(id, true);
          }
        } else {
          alert(errorResult.error || errorResult.message || 'Error deleting task');
        }
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('❌ Terjadi kesalahan saat menghapus tugas');
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'tersedia' ? 'tidak_tersedia' : 'tersedia';
      const response = await fetch(`/api/admin/tugas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.primaryEmailAddress?.emailAddress
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchItems();
      } else {
        alert('Error updating task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Error updating task status');
    }
  };

  const openModal = (item = null, event = null) => {
    // Capture click position
    if (event) {
      setModalPosition({
        top: event.clientY,
        left: event.clientX
      });
    } else {
      setModalPosition(null);
    }
    
    setEditingItem(item);
    if (item) {
      setFormData({
        keyword_tugas: item.keyword_tugas || '',
        deskripsi_tugas: item.deskripsi_tugas || '',
        link_postingan: item.link_postingan || '',
        point_value: item.point_value?.toString() || '10',
        status: item.status || 'tersedia'
      });
    } else {
      setFormData({
        keyword_tugas: '',
        deskripsi_tugas: '',
        link_postingan: '',
        point_value: '10',
        status: 'tersedia'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setModalPosition(null);
    setFormData({
      keyword_tugas: '',
      deskripsi_tugas: '',
      link_postingan: '',
      point_value: '10',
      status: 'tersedia'
    });
  };

  const getStatusLabel = (status) => {
    const statusObj = statusOptions.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  const handleShare = async (taskId) => {
    try {
      const taskUrl = `${window.location.origin}/tugas/${taskId}`;
      
      // Try to use the Web Share API if available (mobile/modern browsers)
      if (navigator.share) {
        await navigator.share({
          title: 'Link Tugas',
          text: 'Lihat tugas ini',
          url: taskUrl
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(taskUrl);
        alert('✅ Link tugas berhasil disalin ke clipboard!\n\n' + taskUrl);
      }
    } catch (error) {
      console.error('Error sharing task:', error);
      // Manual fallback if clipboard API fails
      const taskUrl = `${window.location.origin}/tugas/${taskId}`;
      prompt('Copy link tugas ini:', taskUrl);
    }
  };

  // Fungsi untuk melakukan pencarian
  const handleSearch = () => {
    setSearch(searchInput);
    // Scroll ke atas untuk melihat hasil pencarian
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fungsi untuk handle Enter key pada input pencarian
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Fungsi untuk clear pencarian
  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Memuat data tugas...</div>
      </div>
    );
  }

  // Search & Sorting logic
  let filteredItems = Array.isArray(items) ? items.filter(item => {
    const q = search.toLowerCase();
    return (
      String(item.id).includes(q) ||
      (item.keyword_tugas && item.keyword_tugas.toLowerCase().includes(q)) ||
      (item.deskripsi_tugas && item.deskripsi_tugas.toLowerCase().includes(q)) ||
      (item.link_postingan && item.link_postingan.toLowerCase().includes(q)) ||
      (item.status && item.status.toLowerCase().includes(q))
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

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Manajemen Tugas</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Search Section */}
          <div className="flex gap-2">
            <input
              type="text"
              className="border rounded px-3 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Cari tugas, deskripsi, link, status, ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleSearchKeyPress}
            />
            <button
              onClick={handleSearch}
              className="bg-green-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-green-700 transition-colors"
              title="Cari Tugas"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Cari</span>
            </button>
            {search && (
              <button
                onClick={clearSearch}
                className="bg-gray-500 text-white px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-gray-600 transition-colors"
                title="Bersihkan Pencarian"
              >
                <XMarkIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
          <button
            onClick={(e) => openModal(null, e)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Tambah Tugas
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {search && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 rounded-t-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Pencarian aktif:</span> "{search}"
              </p>
              <button
                onClick={clearSearch}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Bersihkan pencarian
              </button>
            </div>
          </div>
        )}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('id')}>
                ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('keyword_tugas')}>
                Tugas {sortConfig.key === 'keyword_tugas' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('link_postingan')}>
                Link Postingan {sortConfig.key === 'link_postingan' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('point_value')}>
                Point Value {sortConfig.key === 'point_value' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('post_timestamp')}>
                Post Timestamp {sortConfig.key === 'post_timestamp' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('status')}>
                Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedItems.map((item, idx) => {
              const isLast = idx === sortedItems.length - 1;
              return (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50"
                  ref={isLast ? lastTaskElementRef : undefined}
                >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.id}</div>
                </td>                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.keyword_tugas}</div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">{item.deskripsi_tugas}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {item.link_postingan ? (
                    <a 
                      href={item.link_postingan} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm truncate max-w-xs block"
                      title={item.link_postingan}
                    >
                      {formatUrl(item.link_postingan)}
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.point_value} poin</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatTimestamp(item.post_timestamp)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleActive(item.id, item.status)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.status === 'tersedia'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {getStatusLabel(item.status)}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/admin/tugas/${item.id}`)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Lihat Detail & Edit Submissions"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleShare(item.id)}
                      className="text-green-600 hover:text-green-900"
                      title="Share Link Tugas"
                    >
                      <ShareIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => openModal(item, e)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit Tugas"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Hapus Tugas"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>

        {sortedItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">Belum ada data tugas</div>
          </div>
        )}
      </div>

      {/* Modal - Using reusable AdminModal component */}
      <AdminModal
        isOpen={showModal}
        onClose={closeModal}
        title={editingItem ? 'Edit Tugas' : 'Tambah Tugas Baru'}
        maxWidth="max-w-md"
        position={modalPosition}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keyword Tugas
            </label>
            <input
              type="text"
              value={formData.keyword_tugas}
              onChange={(e) => setFormData({ ...formData, keyword_tugas: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi Tugas
            </label>
            <textarea
              value={formData.deskripsi_tugas}
              onChange={(e) => setFormData({ ...formData, deskripsi_tugas: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Deskripsi tugas..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link Postingan
            </label>
            <input
              type="url"
              value={formData.link_postingan}
              onChange={(e) => setFormData({ ...formData, link_postingan: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Point Value
            </label>
            <input
              type="number"
              value={formData.point_value}
              onChange={(e) => setFormData({ ...formData, point_value: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
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
