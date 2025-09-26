'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { PencilIcon, TrashIcon, PlusIcon, EyeIcon, MagnifyingGlassIcon, XMarkIcon, ShareIcon } from '@heroicons/react/24/outline';
import AdminLayout from '../components/AdminLayout';
import AdminModal from '../components/AdminModal';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { GlassContainer, GlassCard, GlassButton } from '@/components/GlassLayout';
import { useResponsive, useGlassEffects } from '@/hooks/useGlassTheme';

export default function TasksPage() {
  const { user } = useUser();
  const router = useRouter();
  const { responsive, isMobile, isTablet } = useResponsive();
  const { getGlassClasses, glassConfig } = useGlassEffects();
  
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
  const [stats, setStats] = useState({
    total_tugas: 0,
    sedang_diverifikasi: 0,
    gagal_diverifikasi: 0,
    verified: 0,
    total_submissions: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
  const statusOptions = [
    { value: 'tersedia', label: 'Tersedia' },
    { value: 'tidak_tersedia', label: 'Tidak Tersedia' },
    { value: 'selesai', label: 'Selesai' }
  ];

  // Helper function untuk format URL
  const formatUrl = (url) => {
    if (!url) return '-';
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      const path = urlObj.pathname.length > 20 ? urlObj.pathname.substring(0, 20) + '...' : urlObj.pathname;
      return `${domain}${path}`;
    } catch {
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
  }, [page, search]);

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      fetchStats();
    }
  }, [user?.primaryEmailAddress?.emailAddress]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      console.log('Fetching stats...');
      const response = await fetch('/api/admin/tugas/stats');
      console.log('Stats response status:', response.status);
      const data = await response.json();
      console.log('Stats data:', data);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchItems = async (pageNum) => {
    if (!hasMore && pageNum !== 1) return;
    
    try {
      console.log('Fetching tasks, page:', pageNum, 'search:', search);
      const response = await fetch(`/api/admin/tugas?page=${pageNum}&q=${encodeURIComponent(search)}`);
      console.log('Tasks response status:', response.status);
      
      const data = await response.json();
      console.log('Tasks data:', data);
      
      if (pageNum === 1) {
        setItems(data.tugas || []);
      } else {
        setItems(prev => [...prev, ...(data.tugas || [])]);
      }
      
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const lastItemElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate point_value before sending
    const pointValue = Number(formData.point_value);
    if (isNaN(pointValue) || pointValue < 1 || pointValue > 2147483647) {
      alert('Point value must be between 1 and 2,147,483,647');
      return;
    }
    
    try {
      const url = editingItem ? `/api/admin/tugas/${editingItem.id}` : '/api/admin/tugas';
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setItems([]);
        setPage(1);
        setHasMore(true);
        fetchItems(1);
        fetchStats();
        closeModal();
      } else {
        alert(result.error || 'Error saving task');
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
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setItems([]);
        setPage(1);
        setHasMore(true);
        fetchItems(1);
        fetchStats();
      } else if (result.hasSubmissions && !forceDelete) {
        if (confirm('Tugas ini memiliki submission. Yakin ingin menghapus beserta semua submission?')) {
          handleDelete(id, true);
        }
      } else {
        alert(result.error || 'Error deleting task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error deleting task');
    }
  };

  const handleEdit = (item, event) => {
    const rect = event.target.getBoundingClientRect();
    setModalPosition({
      top: rect.bottom + window.scrollY + 10,
      left: rect.left + window.scrollX
    });
    
    setEditingItem(item);
    setFormData({
      keyword_tugas: item.keyword_tugas || '',
      deskripsi_tugas: item.deskripsi_tugas || '',
      link_postingan: item.link_postingan || '',
      point_value: item.point_value?.toString() || '',
      status: item.status || 'tersedia'
    });
    setShowModal(true);
  };

  const handleAdd = (event) => {
    const rect = event.target.getBoundingClientRect();
    setModalPosition({
      top: rect.bottom + window.scrollY + 10,
      left: rect.left + window.scrollX
    });
    
    setEditingItem(null);
    setFormData({
      keyword_tugas: '',
      deskripsi_tugas: '',
      link_postingan: '',
      point_value: '',
      status: 'tersedia'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setModalPosition(null);
  };

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusLabel = (status) => {
    const statusObj = statusOptions.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <GlassContainer className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <div className="text-lg text-gray-700">Memuat data tugas...</div>
        </GlassContainer>
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
    <AdminLayout>
      <div className="max-w-full mx-auto space-y-6 p-6">
      {/* Header Section with Glass Effect */}
      <GlassContainer className="p-6" blur="xl" opacity="20" hover={true}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Manajemen Tugas
            </h1>
            <p className="text-gray-600 mt-1">Kelola dan pantau semua tugas dengan mudah</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="flex gap-2">
              <input
                type="text"
                className="backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl px-4 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-gray-600"
                placeholder="Cari tugas, deskripsi, link, status, ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
              <button
                onClick={handleSearch}
                className="backdrop-blur-lg bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-700 px-4 py-2 rounded-xl flex items-center gap-1 transition-all duration-200"
                title="Cari Tugas"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
              </button>
            </div>
            <GlassButton
              onClick={handleAdd}
              variant="primary"
              className="flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap"
            >
              <PlusIcon className="h-4 w-4" />
              Tambah Tugas
            </GlassButton>
          </div>
        </div>
      </GlassContainer>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard title="Total Tugas" gradient="blue" className="p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.total_tugas}</div>
        </GlassCard>
        <GlassCard title="Sedang Diverifikasi" gradient="yellow" className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.sedang_diverifikasi}</div>
        </GlassCard>
        <GlassCard title="Gagal Verifikasi" gradient="red" className="p-4">
          <div className="text-2xl font-bold text-red-600">{stats.gagal_diverifikasi}</div>
        </GlassCard>
        <GlassCard title="Terverifikasi" gradient="green" className="p-4">
          <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
        </GlassCard>
      </div>

      {/* Tasks List */}
      <GlassContainer className="p-6" blur="lg" opacity="15">
        <div className="min-h-[400px]">
          {sortedItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">Belum ada tugas tersedia</div>
              <p className="text-gray-500 text-sm mt-2">Silakan tambah tugas baru untuk mulai mengelola</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-2 font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('id')}>
                      ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('keyword_tugas')}>
                      Keyword {sortConfig.key === 'keyword_tugas' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-800">Deskripsi</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-800">Link</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('point_value')}>
                      Point {sortConfig.key === 'point_value' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('status')}>
                      Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('post_timestamp')}>
                      Dibuat {sortConfig.key === 'post_timestamp' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-800">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item, index) => (
                    <tr 
                      key={item.id} 
                      className="border-b border-white/10 hover:bg-white/10 transition-colors"
                      ref={index === sortedItems.length - 1 ? lastItemElementRef : null}
                    >
                      <td className="py-3 px-2 text-sm text-gray-700 font-mono">#{item.id}</td>
                      <td className="py-3 px-2 text-sm text-gray-800 font-medium max-w-[200px]">
                        <div className="truncate" title={item.keyword_tugas}>
                          {item.keyword_tugas || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-600 max-w-[200px]">
                        <div className="truncate" title={item.deskripsi_tugas}>
                          {item.deskripsi_tugas || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {item.link_postingan ? (
                          <a 
                            href={item.link_postingan} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline max-w-[150px] truncate block"
                            title={item.link_postingan}
                          >
                            {formatUrl(item.link_postingan)}
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-sm font-semibold text-green-600">
                        {item.point_value || 0}
                      </td>
                      <td className="py-3 px-2 text-sm">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'tersedia' 
                            ? 'bg-green-100 text-green-800' 
                            : item.status === 'tidak_tersedia'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-500 font-mono">
                        {formatTimestamp(item.post_timestamp)}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleEdit(item, e)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Tugas"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            title="Hapus Tugas"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                          {item.link_postingan && (
                            <a
                              href={item.link_postingan}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                              title="Lihat Postingan"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </GlassContainer>

      {/* Modal */}
      <AdminModal
        isOpen={showModal}
        onClose={closeModal}
        title={editingItem ? 'Edit Tugas' : 'Tambah Tugas Baru'}
        maxWidth="max-w-md"
        position={modalPosition}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Keyword Tugas
            </label>
            <input
              type="text"
              value={formData.keyword_tugas}
              onChange={(e) => setFormData({ ...formData, keyword_tugas: e.target.value })}
              className="w-full px-4 py-3 backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              required
              placeholder="Masukkan keyword tugas..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Deskripsi Tugas
            </label>
            <textarea
              value={formData.deskripsi_tugas}
              onChange={(e) => setFormData({ ...formData, deskripsi_tugas: e.target.value })}
              className="w-full px-4 py-3 backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              rows="3"
              placeholder="Deskripsi tugas..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Link Postingan
            </label>
            <input
              type="url"
              value={formData.link_postingan}
              onChange={(e) => setFormData({ ...formData, link_postingan: e.target.value })}
              className="w-full px-4 py-3 backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Point Value
            </label>
            <input
              type="number"
              value={formData.point_value}
              onChange={(e) => setFormData({ ...formData, point_value: e.target.value })}
              className="w-full px-4 py-3 backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              required
              min="1"
              max="2147483647"
              placeholder="10"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              required
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-6">
            <GlassButton 
              variant="secondary"
              type="button" 
              onClick={closeModal}
              className="flex-1"
            >
              Batal
            </GlassButton>
            <GlassButton 
              variant="primary"
              type="submit"
              className="flex-1"
            >
              {editingItem ? 'Update' : 'Simpan'}
            </GlassButton>
          </div>
        </form>
      </AdminModal>

      <ScrollToTopButton />
      </div>
    </AdminLayout>
  );
}
