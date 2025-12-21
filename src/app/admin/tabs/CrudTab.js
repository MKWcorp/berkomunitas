'use client';
import { useState, useEffect } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import AdminModal from '../components/AdminModal';
import ScrollToTopButton from '../components/ScrollToTopButton';

// Helper function to get email from member object
function getMemberEmail(member) {
  if (!member) return '';
  if (member.member_emails && member.member_emails.length > 0) {
    return member.member_emails[0].email;
  }
  return member.email || '';
}

export default function CrudTab({ resource }) {
  const { user } = useSSOUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Common states
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);

  // Resource-specific states
  const [rewards, setRewards] = useState([]);
  const [badges, setBadges] = useState([]);
  const [levels, setLevels] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  const [rewardsLoading, setRewardsLoading] = useState(true);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [levelsLoading, setLevelsLoading] = useState(true);
  
  const [rewardsError, setRewardsError] = useState(null);
  const [badgesError, setBadgesError] = useState(null);
  const [levelsError, setLevelsError] = useState(null);

  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showLevelsModal, setShowLevelsModal] = useState(false);

  const [editReward, setEditReward] = useState(null);
  const [editBadge, setEditBadge] = useState(null);
  const [editLevel, setEditLevel] = useState(null);

  const [rewardForm, setRewardForm] = useState({ reward_name: '', description: '', point_cost: 0 });
  const [badgeForm, setBadgeForm] = useState({ badge_name: '', description: '', criteria_type: 'manual', criteria_value: 0 });
  const [levelForm, setLevelForm] = useState({ level_number: '', level_name: '', required_points: 0 });
  const [form, setForm] = useState({ deskripsi_tugas: '', keyword_tugas: '', status: 'aktif', point_value: 0 });

  const [savingReward, setSavingReward] = useState(false);
  const [savingBadge, setSavingBadge] = useState(false);
  const [savingLevel, setSavingLevel] = useState(false);

  // Determine what data to show based on resource
  const isRewards = resource === 'rewards';
  const isBadges = resource === 'badges';
  const isLevels = resource === 'levels';
  const isTugas = resource === 'tugas';

  // Load data based on resource type
  useEffect(() => {
    const loadData = async () => {
      if (!user?.email) return;
      
      try {
        setLoading(true);
        const endpoint = `/api/admin/${resource}`;
        const response = await fetch(endpoint, {
          headers: { 'x-user-email': user.email }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          switch (resource) {
            case 'rewards':
              setRewards(data.rewards || []);
              setRewardsError(null);
              break;
            case 'badges':
              setBadges(data.badges || []);
              setBadgesError(null);
              break;
            case 'levels':
              setLevels(data.levels || []);
              setLevelsError(null);
              break;
            case 'tugas':
              setTasks(data.tasks || []);
              setError(null);
              break;
          }
        } else {
          const errorData = await response.json();
          const errorMessage = errorData.error || `Gagal memuat data ${resource}`;
          
          switch (resource) {
            case 'rewards':
              setRewardsError(errorMessage);
              break;
            case 'badges':
              setBadgesError(errorMessage);
              break;
            case 'levels':
              setLevelsError(errorMessage);
              break;
            case 'tugas':
              setError(errorMessage);
              break;
          }
        }
      } catch (err) {
        const errorMessage = `Terjadi kesalahan saat memuat data ${resource}`;
        switch (resource) {
          case 'rewards':
            setRewardsError(errorMessage);
            break;
          case 'badges':
            setBadgesError(errorMessage);
            break;
          case 'levels':
            setLevelsError(errorMessage);
            break;
          case 'tugas':
            setError(errorMessage);
            break;
        }
      } finally {
        setLoading(false);
        setRewardsLoading(false);
        setBadgesLoading(false);
        setLevelsLoading(false);
      }
    };

    loadData();
  }, [resource, user]);

  // Generic handlers
  const openAddModal = () => {
    setEditItem(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    resetForm();
  };

  const resetForm = () => {
    switch (resource) {
      case 'rewards':
        setRewardForm({ reward_name: '', description: '', point_cost: 0 });
        break;
      case 'badges':
        setBadgeForm({ badge_name: '', description: '', criteria_type: 'manual', criteria_value: 0 });
        break;
      case 'levels':
        setLevelForm({ level_number: '', level_name: '', required_points: 0 });
        break;
      case 'tugas':
        setForm({ deskripsi_tugas: '', keyword_tugas: '', status: 'aktif', point_value: 0 });
        break;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Memuat data {resource}...</div>;
  }

  // For now, return a placeholder for non-tugas resources
  if (!isTugas) {
    return <div className="text-gray-500">CRUD for {resource} coming soon...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Kelola {resource}</h2>
        <button 
          onClick={openAddModal} 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Tambah {resource}
        </button>
      </div>

      {error ? (
        <div className="text-center text-red-500 py-8">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs md:text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1 border">ID</th>
                <th className="px-2 py-1 border">Deskripsi</th>
                <th className="px-2 py-1 border">Keywords</th>
                <th className="px-2 py-1 border">Poin</th>
                <th className="px-2 py-1 border">Status</th>
                <th className="px-2 py-1 border">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-2 py-1 border text-center">{item.id}</td>
                  <td className="px-2 py-1 border">{item.deskripsi_tugas}</td>
                  <td className="px-2 py-1 border">{item.keyword_tugas}</td>
                  <td className="px-2 py-1 border text-center">{item.point_value}</td>
                  <td className="px-2 py-1 border text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-2 py-1 border text-center">
                    <button
                      onClick={() => {
                        setEditItem(item);
                        setForm({
                          deskripsi_tugas: item.deskripsi_tugas,
                          keyword_tugas: item.keyword_tugas,
                          status: item.status,
                          point_value: item.point_value
                        });
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal using AdminModal component */}
      <AdminModal
        isOpen={showModal}
        onClose={closeModal}
        title={`${editItem ? 'Edit' : 'Tambah'} ${resource}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Deskripsi Tugas</label>
            <textarea 
              className="w-full border rounded px-3 py-2" 
              value={form.deskripsi_tugas} 
              onChange={e => setForm(f => ({ ...f, deskripsi_tugas: e.target.value }))} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Keyword Tugas</label>
            <input 
              type="text" 
              className="w-full border rounded px-3 py-2" 
              value={form.keyword_tugas} 
              onChange={e => setForm(f => ({ ...f, keyword_tugas: e.target.value }))} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Poin</label>
            <input 
              type="number" 
              className="w-full border rounded px-3 py-2" 
              value={form.point_value} 
              onChange={e => setForm(f => ({ ...f, point_value: Number(e.target.value) }))} 
              required 
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select 
              className="w-full border rounded px-3 py-2" 
              value={form.status} 
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            >
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={closeModal} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Batal</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </AdminModal>

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  );

  // Placeholder handlers
  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    // TODO: Implement save logic
    setSaving(false);
    closeModal();
  }

  async function handleDelete(id) {
    if (!confirm('Yakin ingin menghapus item ini?')) return;
    // TODO: Implement delete logic
  }
}
