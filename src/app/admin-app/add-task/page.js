'use client';
import { useState } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { GlassContainer, GlassButton } from '@/components/GlassLayout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function AddTaskPage() {
  const { user } = useSSOUser();
  const router = useRouter();
  
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
  
  const [keywordsInput, setKeywordsInput] = useState(''); // String untuk input keywords
  const [loading, setLoading] = useState(false);
  
  const statusOptions = [
    { value: 'tersedia', label: 'Tersedia' },
    { value: 'tidak_tersedia', label: 'Tidak Tersedia' },
    { value: 'selesai', label: 'Selesai' }
  ];

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
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/tugas-ai-2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('✅ Tugas berhasil ditambahkan!');
        
        // Reset form ke kondisi awal
        setFormData({
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
        
        // Reset keywords input
        setKeywordsInput('');
      } else {
        alert(result.error || 'Error saving task');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Error saving task');
    } finally {
      setLoading(false);
    }
  };

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
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tambah Tugas Baru (Screenshot)</h1>
          <p className="text-gray-600">Buat tugas yang memerlukan screenshot sebagai bukti penyelesaian</p>
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
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
                disabled={loading}
              >
                Batal
              </GlassButton>
              <GlassButton 
                variant="primary"
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Menyimpan...' : 'Simpan Tugas'}
              </GlassButton>
            </div>
          </form>
        </GlassContainer>
      </div>
    </AdminLayout>
  );
}
