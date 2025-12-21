"use client";
import { useState, useEffect, useRef } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { PencilIcon, TrashIcon, PhotoIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import GlassCard from '../../components/GlassCard';
import AdminModal from '../components/AdminModal';
import ScrollToTopButton from '../components/ScrollToTopButton';

export default function RewardsTab() {
  const { user } = useSSOUser();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editReward, setEditReward] = useState(null);
  const [form, setForm] = useState({ reward_name: '', description: '', point_cost: 0, foto_url: '', stock: 0 });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  // Redemption history state
  const [redemptions, setRedemptions] = useState([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(true);
  const [redemptionError, setRedemptionError] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState({ open: false, redemption: null, reason: '' });

  // Load rewards data
  useEffect(() => {
    loadRewards();
    loadRedemptions();
  }, [user]);
  // Load redemption history
  const loadRedemptions = async () => {
    if (!user?.email) return;
    try {
      setLoadingRedemptions(true);
      const response = await fetch('/api/admin/redemptions');
      if (response.ok) {
        const data = await response.json();
        setRedemptions(data.data || []);
        setRedemptionError(null);
      } else {
        const errorData = await response.json();
        setRedemptionError(errorData.error || 'Gagal memuat riwayat penukaran hadiah');
      }
    } catch (err) {
      setRedemptionError('Terjadi kesalahan saat memuat riwayat penukaran hadiah');
    } finally {
      setLoadingRedemptions(false);
    }
  };
  // Handle verify redemption
  const handleVerify = async (redemptionId) => {
    setVerifyLoading(true);
    try {
      const response = await fetch('/api/admin/redemptions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redemptionId })
      });
      if (response.ok) {
        await loadRedemptions();
        alert('Penukaran berhasil diverifikasi');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Gagal verifikasi penukaran');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat verifikasi penukaran');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Handle reject redemption
  const handleReject = async () => {
    if (!rejectModal.redemption || !rejectModal.reason.trim()) {
      alert('Alasan penolakan wajib diisi');
      return;
    }
    setVerifyLoading(true);
    try {
      const response = await fetch('/api/admin/redemptions/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redemptionId: rejectModal.redemption.id, reason: rejectModal.reason })
      });
      if (response.ok) {
        await loadRedemptions();
        setRejectModal({ open: false, redemption: null, reason: '' });
        alert('Penukaran berhasil ditolak');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Gagal menolak penukaran');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menolak penukaran');
    } finally {
      setVerifyLoading(false);
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
  setForm({ reward_name: '', description: '', point_cost: 0, foto_url: '', stock: 0 });
    setShowModal(true);
  };

  const openEditModal = (reward) => {
    setEditReward(reward);
    setForm({
      reward_name: reward.reward_name,
      description: reward.description,
      point_cost: reward.point_cost,
  foto_url: reward.foto_url || '',
  stock: reward.stock || 0
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditReward(null);
    setForm({ reward_name: '', description: '', point_cost: 0, foto_url: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.email) return;

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

  // Sorting logic
  let sortedRewards = Array.isArray(rewards) ? [...rewards] : [];
  if (sortConfig.key) {
    sortedRewards.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  if (loading) {
    return (
      <GlassCard className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <div className="text-gray-700">Memuat data hadiah...</div>
      </GlassCard>
    );
  }

  return (
    <div>
      <GlassCard className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Kelola Hadiah</h2>
          <button 
            onClick={openAddModal} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            + Tambah Hadiah
          </button>
        </div>
      </GlassCard>

      {/* Tabel Hadiah */}
      {error ? (
        <GlassCard className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <div className="text-red-700">{error}</div>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="overflow-x-auto mb-12">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border-b text-left cursor-pointer select-none" onClick={() => handleSort('id')}>
                  ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="px-4 py-2 border-b text-left">Foto</th>
                <th className="px-4 py-2 border-b text-left cursor-pointer select-none" onClick={() => handleSort('reward_name')}>
                  Nama Hadiah {sortConfig.key === 'reward_name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="px-4 py-2 border-b text-left cursor-pointer select-none" onClick={() => handleSort('description')}>
                  Deskripsi {sortConfig.key === 'description' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="px-4 py-2 border-b text-center cursor-pointer select-none" onClick={() => handleSort('point_cost')}>
                  Harga Poin {sortConfig.key === 'point_cost' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="px-4 py-2 border-b text-center cursor-pointer select-none" onClick={() => handleSort('stock')}>
                  Stok {sortConfig.key === 'stock' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="px-4 py-2 border-b text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedRewards.map(reward => (
                <tr key={reward.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{reward.id}</td>
                  <td className="px-4 py-2">
                    {reward.foto_url ? (
                      <img src={reward.foto_url} alt={reward.reward_name} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <PhotoIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 font-medium">{reward.reward_name}</td>
                  <td className="px-4 py-2">{reward.description}</td>
                  <td className="px-4 py-2 text-center">{reward.point_cost}</td>
                  <td className="px-4 py-2 text-center">{reward.stock ?? 0}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEditModal(reward)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                        title="Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(reward.id)}
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
        </GlassCard>
      )}

      {/* Tabel Riwayat Penukaran Hadiah */}
      <GlassCard className="mt-8">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Riwayat Penukaran Hadiah</h3>
      {loadingRedemptions ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-700">Memuat riwayat penukaran...</div>
        </div>
      ) : redemptionError ? (
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <div className="text-red-700">{redemptionError}</div>
        </div>
      ) : (
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border-b">ID</th>
                <th className="px-4 py-2 border-b">Tanggal</th>
                <th className="px-4 py-2 border-b">Nama Member</th>
                <th className="px-4 py-2 border-b">Hadiah</th>
                <th className="px-4 py-2 border-b text-center">Poin</th>
                <th className="px-4 py-2 border-b text-center">Status</th>
                <th className="px-4 py-2 border-b text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {redemptions.map(red => (
                <tr key={red.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{red.id}</td>
                  <td className="px-4 py-2">{new Date(red.redeemed_at).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-2">{red.nama_lengkap}</td>
                  <td className="px-4 py-2">{red.reward_name}</td>
                  <td className="px-4 py-2 text-center">{red.points_spent}</td>
                  <td className="px-4 py-2 text-center capitalize">{red.status.replace('_', ' ')}</td>
                  <td className="px-4 py-2 text-center">
                    {red.status === 'menunggu_verifikasi' && (
                      <div className="flex gap-2 justify-center">
                        <button
                          className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 text-xs"
                          disabled={verifyLoading}
                          onClick={() => handleVerify(red.id)}
                        >
                          {verifyLoading ? 'Memproses...' : 'Verifikasi'}
                        </button>
                        <button
                          className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 text-xs"
                          disabled={verifyLoading}
                          onClick={() => setRejectModal({ open: true, redemption: red, reason: '' })}
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </GlassCard>

      {/* Modal Tambah/Edit Hadiah */}
      <AdminModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editReward ? 'Edit Hadiah' : 'Tambah Hadiah'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Hadiah</label>
            <input 
              type="text" 
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              value={form.reward_name} 
              onChange={e => setForm(f => ({ ...f, reward_name: e.target.value }))} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deskripsi</label>
            <textarea 
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              value={form.description} 
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
              rows="3"
              required 
            />
          </div>
          
          {/* Foto Upload Section */}
          <div>
            <label className="block text-sm font-medium mb-1">Foto Hadiah</label>
            <div className="space-y-2">
              {form.foto_url && (
                <div className="relative inline-block">
                  <img src={form.foto_url} alt="Preview" className="w-20 h-20 object-cover rounded border" />
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
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <PhotoIcon className="w-4 h-4 mr-2" />
                  {uploading ? 'Mengupload...' : (form.foto_url ? 'Ganti Foto' : 'Upload Foto')}
                </button>
              </div>
              <p className="text-xs text-gray-500">Maksimal 5MB. Format: JPG, PNG, GIF, WebP</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Harga Poin</label>
            <input 
              type="number" 
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              value={form.point_cost} 
              onChange={e => setForm(f => ({ ...f, point_cost: Number(e.target.value) }))} 
              required 
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stok</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={form.stock}
              onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))}
              required
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Jumlah stok fisik atau ketersediaan hadiah</p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={closeModal} 
              className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Modal Tolak Penukaran */}
      <AdminModal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, redemption: null, reason: '' })}
        title="Tolak Penukaran Hadiah"
        maxWidth="max-w-md"
      >
        <div className="mb-4">Alasan penolakan wajib diisi:</div>
        <textarea
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
          rows="3"
          value={rejectModal.reason}
          onChange={e => setRejectModal(m => ({ ...m, reason: e.target.value }))}
          required
        />
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setRejectModal({ open: false, redemption: null, reason: '' })}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={verifyLoading}
            onClick={handleReject}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {verifyLoading ? 'Memproses...' : 'Tolak Penukaran'}
          </button>
        </div>
      </AdminModal>
    </div>
  );
}
