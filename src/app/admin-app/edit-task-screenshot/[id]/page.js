'use client';
import { useState, useEffect } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import { GlassContainer, GlassButton } from '@/components/GlassLayout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function EditTaskScreenshotPage({ params }) {
  const { user } = useSSOUser();
  const router = useRouter();
  const { id } = params;
  
  const [formData, setFormData] = useState({
    keyword_tugas: '',
    deskripsi_tugas: '',
    link_postingan: '',
    point_value: '10',
    status: 'tersedia',
    source: 'manual',
    verification_rules: {
      required_keywords: [],
      min_confidence: 0.7,
      check_screenshot: true
    }
  });
  
  const [keywordsInput, setKeywordsInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const statusOptions = [
    { value: 'tersedia', label: 'Tersedia' },
    { value: 'tidak_tersedia', label: 'Tidak Tersedia' },
    { value: 'selesai', label: 'Selesai' }
  ];

  useEffect(() => {
    if (id) {
      fetchTask();
    }
  }, [id]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/admin/tugas-ai-2/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setFormData({
          keyword_tugas: data.keyword_tugas || '',
          deskripsi_tugas: data.deskripsi_tugas || '',
          link_postingan: data.link_postingan || '',
          point_value: String(data.point_value || 10),
          status: data.status || 'tersedia',
          source: data.source || 'manual',
          verification_rules: data.verification_rules || {
            required_keywords: [],
            min_confidence: 0.7,
            check_screenshot: true
          }
        });
        
        // Set keywords input from verification_rules
        if (data.verification_rules?.required_keywords) {
          setKeywordsInput(data.verification_rules.required_keywords.join(', '));
        }
      } else {
        alert('Error fetching task');
        router.push('/admin-app/tasks');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      alert('Error fetching task');
      router.push('/admin-app/tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate point_value before sending
    const pointValue = Number(formData.point_value);
    if (isNaN(pointValue) || pointValue < 1 || pointValue > 2147483647) {
      alert('Point value must be between 1 and 2,147,483,647');
      return;
    }
    
    // Convert keywords string to array and validate
    const keywordsArray = keywordsInput.split(',').map(k => k.trim()).filter(k => k);
    if (keywordsArray.length === 0) {
      alert('Required Keywords wajib diisi untuk AI verification!');
      return;
    }
    
    // Update formData with keywords array before sending
    const dataToSend = {
      ...formData,
      verification_rules: {
        ...formData.verification_rules,
        required_keywords: keywordsArray
      }
    };
    
    setSaving(true);
    
    try {
      const response = await fetch(`/api/admin/tugas-ai-2/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('✅ Tugas berhasil diupdate!');
        router.push('/admin-app/tasks');
      } else {
        alert(result.error || 'Error updating task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <GlassContainer className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <div className="text-lg text-gray-700">Memuat data tugas...</div>
          </GlassContainer>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin-app/tasks')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Kembali ke Tasks</span>
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Tugas Screenshot #{id}</h1>
          <p className="text-gray-600">Update tugas yang memerlukan screenshot sebagai bukti penyelesaian</p>
        </div>

        {/* Form Card */}
        <GlassContainer>
          <form onSubmit={handleSubmit} className="space-y-6 p-8">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Judul Tugas <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.keyword_tugas}
                onChange={(e) => setFormData({ ...formData, keyword_tugas: e.target.value })}
                className="w-full px-4 py-3 backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                required
                placeholder="Contoh: Komentar di Instagram + Upload Screenshot"
                disabled={saving}
              />
              <p className="mt-1 text-sm text-gray-500">Judul singkat yang mendeskripsikan tugas</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Deskripsi Tugas
              </label>
              <textarea
                value={formData.deskripsi_tugas}
                onChange={(e) => setFormData({ ...formData, deskripsi_tugas: e.target.value })}
                className="w-full px-4 py-3 backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                rows="4"
                placeholder="Jelaskan detail tugas yang harus dikerjakan member..."
                disabled={saving}
              />
              <p className="mt-1 text-sm text-gray-500">Detail instruksi untuk member</p>
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
                disabled={saving}
              />
              <p className="mt-1 text-sm text-gray-500">URL postingan terkait (opsional)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Point Value <span className="text-red-500">*</span>
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
                  disabled={saving}
                />
                <p className="mt-1 text-sm text-gray-500">Poin yang didapat member (1-2,147,483,647)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                  required
                  disabled={saving}
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">Status tersedia/tidak tersedia</p>
              </div>
            </div>

            {/* Verification Rules */}
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Screenshot Verification Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Required Keywords <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={keywordsInput}
                    onChange={(e) => setKeywordsInput(e.target.value)}
                    className="w-full px-4 py-3 backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                    placeholder="produk, keren, bagus"
                    required
                    disabled={saving}
                  />
                  <p className="mt-1 text-sm text-gray-500">Kata-kata yang HARUS ada di screenshot untuk AI verification (pisahkan dengan koma)</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Minimum Confidence Score
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={formData.verification_rules.min_confidence}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      verification_rules: {
                        ...formData.verification_rules,
                        min_confidence: parseFloat(e.target.value)
                      }
                    })}
                    className="w-full px-4 py-3 backdrop-blur-lg bg-white/30 border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                    disabled={saving}
                  />
                  <p className="mt-1 text-sm text-gray-500">Skor minimum untuk AI verification (0.0 - 1.0, default: 0.7)</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-white/20">
              <GlassButton 
                variant="secondary"
                type="button" 
                onClick={() => router.push('/admin-app/tasks')}
                className="flex-1"
                disabled={saving}
              >
                Batal
              </GlassButton>
              <GlassButton 
                variant="primary"
                type="submit"
                className="flex-1"
                disabled={saving}
              >
                {saving ? 'Menyimpan...' : 'Update Tugas'}
              </GlassButton>
            </div>
          </form>
        </GlassContainer>
      </div>
    </AdminLayout>
  );
}
