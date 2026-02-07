"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { PencilIcon, TrashIcon, PhotoIcon, ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import GlassCard from '../components/GlassCard';
import AdminModal from '../../admin-app/components/AdminModal';
import ScrollToTopButton from '../../admin-app/components/ScrollToTopButton';

export default function RewardsManagementPage() {
  const { user } = useSSOUser();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editReward, setEditReward] = useState(null);
  const [form, setForm] = useState({ 
    reward_name: '', 
    description: '', 
    point_cost: 10, 
    foto_url: '', 
    stock: 10,
    category_id: null,
    required_privilege: null
  });
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'stock', 'exclusive', or category_id
  
  // Category management states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: 'blue',
    sort_order: 0
  });

  // Load rewards data
  useEffect(() => {
    loadRewards();
    loadCategories();
  }, [user]);

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/reward-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  // Category management functions
  const openCategoryModal = () => {
    setCategoryForm({
      name: '',
      description: '',
      color: 'blue',
      sort_order: categories.length + 1
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!user?.email) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/reward-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        },
        body: JSON.stringify(categoryForm)
      });

      if (response.ok) {
        await loadCategories();
        setShowCategoryModal(false);
        setCategoryForm({
          name: '',
          description: '',
          icon: '',
          color: 'blue',
          sort_order: 0
        });
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Gagal menyimpan kategori');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menyimpan kategori');
    } finally {
      setSaving(false);
    }
  };

  const loadRewards = async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/admin/rewards', {
        headers: { 'x-user-email': user.email }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRewards(data.rewards || []);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Gagal memuat data hadiah');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data hadiah');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditReward(null);
    setForm({ 
      reward_name: '', 
      description: '', 
      point_cost: 10, 
      foto_url: '', 
      stock: 10,
      category_id: null,
      required_privilege: null
    });
    setShowModal(true);
  };

  const openEditModal = (reward) => {
    setEditReward(reward);
    setForm({
      reward_name: reward.reward_name,
      description: reward.description,
      point_cost: reward.point_cost,
      foto_url: reward.foto_url || '',
      stock: reward.stock || 0,
      category_id: reward.category_id || null,
      required_privilege: reward.required_privilege || null
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditReward(null);
    setForm({ reward_name: '', description: '', point_cost: 10, foto_url: '', stock: 10, category_id: null, required_privilege: null });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.email) return;

    // Validation: All fields are required
    if (!form.reward_name.trim()) {
      alert('Nama hadiah wajib diisi');
      return;
    }
    if (!form.description.trim()) {
      alert('Deskripsi hadiah wajib diisi');
      return;
    }
    if (!form.foto_url.trim()) {
      alert('Foto hadiah wajib diupload');
      return;
    }
    if (!form.point_cost || form.point_cost <= 0) {
      alert('Harga poin harus lebih dari 0');
      return;
    }
    if (!form.stock || form.stock <= 0) {
      alert('Stok harus lebih dari 0');
      return;
    }

    setSaving(true);
    try {
      const method = editReward ? 'PUT' : 'POST';
      const url = editReward ? `/api/admin/rewards/${editReward.id}` : '/api/admin/rewards';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        await loadRewards();
        closeModal();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Gagal menyimpan hadiah');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menyimpan hadiah');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/rewards/upload-foto', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Upload gagal (${response.status})`);
      }

      const result = await response.json();
      if (result?.success) {
        setForm(prev => ({ ...prev, foto_url: result.foto_url }));
        alert('Foto hadiah berhasil diupload!');
      } else {
        throw new Error(result?.error || 'Gagal mengupload foto');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus hadiah ini?')) return;
    if (!user?.email) return;

    try {
      const response = await fetch(`/api/admin/rewards/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': user.email }
      });

      if (response.ok) {
        await loadRewards();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Gagal menghapus hadiah');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus hadiah');
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Filter rewards based on active filter and search term
  const getFilteredRewards = React.useCallback(() => {
    let filtered = [...rewards];
    
    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(reward => 
        reward.reward_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reward.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    switch (activeFilter) {
      case 'stock':
        filtered = filtered.filter(r => r.stock > 0);
        break;
      case 'exclusive':
        filtered = filtered.filter(r => r.required_privilege === 'berkomunitasplus');
        break;
      case 'all':
        // No additional filtering
        break;
      default:
        // Check if it's a category ID (number)
        if (typeof activeFilter === 'number' || !isNaN(activeFilter)) {
          filtered = filtered.filter(r => r.category_id === parseInt(activeFilter));
        }
        break;
    }
    
    return filtered;
  }, [rewards, searchTerm, activeFilter]);

  // Handle filter button clicks
  const handleFilterClick = (filterType) => {
    // If it's a category ID (number), always apply it directly
    if (typeof filterType === 'number') {
      setActiveFilter(activeFilter === filterType ? 'all' : filterType);
    } else {
      // For string filters, toggle between 'all' and the filter
      setActiveFilter(activeFilter === filterType ? 'all' : filterType);
    }
  };

  // Get filtered and sorted rewards
  const getFilteredAndSortedRewards = React.useCallback(() => {
    let filtered = getFilteredRewards();
    
    // Apply sorting
    if (sortConfig.key && filtered.length > 0) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [getFilteredRewards, sortConfig]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header dengan design rewards theme */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <span className="text-2xl">🎁</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Rewards Management System</h1>
              <p className="text-green-100">Kelola hadiah dan sistem penukaran poin</p>
            </div>
          </div>
        </div>

        <GlassCard className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <div className="text-gray-700 text-lg">Memuat data rewards...</div>
          <div className="text-sm text-gray-500 mt-2">Tunggu sebentar</div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header dengan design rewards theme */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <span className="text-2xl">🎁</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Rewards Management System</h1>
              <p className="text-green-100">Kelola hadiah dan sistem penukaran poin</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={openCategoryModal} 
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-xl transition-colors font-semibold backdrop-blur-sm"
            >
              + Tambah Kategori
            </button>
            <button 
              onClick={openAddModal} 
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl transition-colors font-semibold backdrop-blur-sm"
            >
              + Tambah Hadiah Baru
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats - Now as Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard 
          className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
            activeFilter === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          }`}
          onClick={() => handleFilterClick('all')}
        >
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${activeFilter === 'all' ? 'bg-blue-200' : 'bg-blue-100'}`}>
              <span className="text-2xl">🎁</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{rewards.length}</div>
              <div className="text-sm text-gray-600">Total Hadiah</div>
              {activeFilter === 'all' && <div className="text-xs text-blue-600 font-medium">● Aktif</div>}
            </div>
          </div>
        </GlassCard>
        
        <GlassCard 
          className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
            activeFilter === 'stock' ? 'ring-2 ring-yellow-500 bg-yellow-50' : 'hover:bg-gray-50'
          }`}
          onClick={() => handleFilterClick('stock')}
        >
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${activeFilter === 'stock' ? 'bg-yellow-200' : 'bg-yellow-100'}`}>
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {rewards.filter(r => r.stock > 0).length}
              </div>
              <div className="text-sm text-gray-600">Stok Tersedia</div>
              {activeFilter === 'stock' && <div className="text-xs text-yellow-600 font-medium">● Aktif</div>}
            </div>
          </div>
        </GlassCard>
        
        <GlassCard 
          className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
            activeFilter === 'exclusive' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'
          }`}
          onClick={() => handleFilterClick('exclusive')}
        >
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${activeFilter === 'exclusive' ? 'bg-green-200' : 'bg-green-100'}`}>
              <span className="text-2xl">⭐</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {rewards.filter(r => r.required_privilege === 'berkomunitasplus').length}
              </div>
              <div className="text-sm text-gray-600">Hadiah Eksklusif</div>
              {activeFilter === 'exclusive' && <div className="text-xs text-green-600 font-medium">● Aktif</div>}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Search Bar */}
      <GlassCard className="p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari hadiah berdasarkan nama atau deskripsi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        {(activeFilter !== 'all' || searchTerm) && (
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Menampilkan {getFilteredRewards().length} dari {rewards.length} hadiah
              {searchTerm && ` untuk "${searchTerm}"`}
            </div>
            <button
              onClick={() => {
                setActiveFilter('all');
                setSearchTerm('');
              }}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Reset Filter
            </button>
          </div>
        )}
      </GlassCard>

      {/* Category Filter Cards */}
      {categories.length > 0 && (
        <GlassCard className="p-4">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Filter berdasarkan Kategori:</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => {
                const colorClasses = {
                  blue: activeFilter === category.id ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500' : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700',
                  green: activeFilter === category.id ? 'bg-green-100 text-green-800 ring-2 ring-green-500' : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700',
                  yellow: activeFilter === category.id ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-500' : 'bg-gray-100 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700',
                  red: activeFilter === category.id ? 'bg-red-100 text-red-800 ring-2 ring-red-500' : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700',
                  purple: activeFilter === category.id ? 'bg-purple-100 text-purple-800 ring-2 ring-purple-500' : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700',
                  pink: activeFilter === category.id ? 'bg-pink-100 text-pink-800 ring-2 ring-pink-500' : 'bg-gray-100 text-gray-700 hover:bg-pink-50 hover:text-pink-700',
                  gray: activeFilter === category.id ? 'bg-gray-200 text-gray-800 ring-2 ring-gray-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-800'
                };
                
                return (
                  <button
                    key={category.id}
                    onClick={() => handleFilterClick(category.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      colorClasses[category.color] || colorClasses.gray
                    }`}
                  >
                    {category.name}
                    <span className="ml-1 text-xs opacity-75">
                      ({rewards.filter(r => r.category_id === category.id).length})
                    </span>
                  </button>
                );
              })}
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  activeFilter === 'all'
                    ? 'bg-gray-800 text-white ring-2 ring-gray-600'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                Semua Kategori ({rewards.length})
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Tabel Hadiah */}
      {error ? (
        <GlassCard className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <div className="text-red-700">{error}</div>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <span className="mr-2">🎁</span>
              Daftar Hadiah
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('reward_name')}>
                    Nama Hadiah {sortConfig.key === 'reward_name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('point_cost')}>
                    Harga Poin {sortConfig.key === 'point_cost' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('stock')}>
                    Stok {sortConfig.key === 'stock' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredAndSortedRewards().map(reward => (
                  <tr key={reward.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {reward.foto_url ? (
                        <img src={reward.foto_url} alt={reward.reward_name} className="w-16 h-16 object-cover rounded-lg shadow-sm" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <PhotoIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{reward.reward_name}</div>
                      {reward.required_privilege && (
                        <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full inline-block mt-1">
                          {reward.required_privilege === 'berkomunitasplus' ? 'Berkomunitas+' : reward.required_privilege}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {reward.category_name ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {reward.category_name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Tidak ada</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-[120px] truncate">{reward.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {reward.point_cost} poin
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        (reward.stock ?? 0) > 0 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {reward.stock ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => openEditModal(reward)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(reward.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Hapus"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Modal Tambah/Edit Hadiah */}
      <AdminModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editReward ? 'Edit Hadiah' : 'Tambah Hadiah'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Hadiah <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
              value={form.reward_name} 
              onChange={e => setForm(f => ({ ...f, reward_name: e.target.value }))} 
              required 
              placeholder="Masukkan nama hadiah"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi <span className="text-red-500">*</span></label>
            <textarea 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
              value={form.description} 
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
              rows="4"
              required 
              placeholder="Deskripsikan hadiah ini..."
            />
          </div>
          
          {/* Foto Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Foto Hadiah <span className="text-red-500">*</span></label>
            <div className="space-y-4">
              {form.foto_url && (
                <div className="relative inline-block">
                  <img src={form.foto_url} alt="Preview" className="w-24 h-24 object-cover rounded-lg border shadow-sm" />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, foto_url: '' }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              )}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <PhotoIcon className="w-5 h-5 mr-2" />
                  {uploading ? 'Mengupload...' : (form.foto_url ? 'Ganti Foto' : 'Upload Foto')}
                </button>
              </div>
              <p className="text-xs text-gray-500">Maksimal 5MB. Format: JPG, PNG, GIF, WebP</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Harga Poin <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
                value={form.point_cost} 
                onChange={e => setForm(f => ({ ...f, point_cost: Number(e.target.value) }))} 
                required 
                min="1"
                placeholder="10"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stok <span className="text-red-500">*</span></label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))}
                required
                min="1"
                placeholder="10"
              />
            </div>
          </div>
          
          {/* Kategori dan Privilege */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
              <select 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                value={form.category_id || ''}
                onChange={e => setForm(f => ({ ...f, category_id: e.target.value ? parseInt(e.target.value) : null }))}
              >
                <option value="">Pilih Kategori (Opsional)</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Akses Khusus</label>
              <select 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                value={form.required_privilege || ''}
                onChange={e => setForm(f => ({ ...f, required_privilege: e.target.value || null }))}
              >
                <option value="">Akses Umum</option>
                <option value="berkomunitasplus">Berkomunitas Plus</option>
                <option value="partner">Partner</option>
                <option value="admin">Admin</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Hadiah akan hanya bisa diakses oleh pengguna dengan privilege tertentu
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button 
              type="button" 
              onClick={closeModal} 
              className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className="px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Modal Tambah Kategori */}
      <AdminModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Tambah Kategori Hadiah"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Kategori <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
              value={categoryForm.name} 
              onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))} 
              required 
              placeholder="e.g. Elektronik, Fashion, Makanan"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
            <textarea 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
              value={categoryForm.description} 
              onChange={e => setCategoryForm(f => ({ ...f, description: e.target.value }))} 
              rows="3"
              placeholder="Deskripsi kategori (opsional)"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Warna</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              value={categoryForm.color}
              onChange={e => setCategoryForm(f => ({ ...f, color: e.target.value }))}
            >
              <option value="blue">Biru</option>
              <option value="green">Hijau</option>
              <option value="yellow">Kuning</option>
              <option value="red">Merah</option>
              <option value="purple">Ungu</option>
              <option value="pink">Pink</option>
              <option value="gray">Abu-abu</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => setShowCategoryModal(false)}
              className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
            >
              {saving ? 'Menyimpan...' : 'Simpan Kategori'}
            </button>
          </div>
        </form>
      </AdminModal>

      <ScrollToTopButton />
    </div>
  );
}