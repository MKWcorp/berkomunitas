import { useState, useEffect } from 'react';
import { 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

export default function EditableBCForm({ connectionStatus, onDataUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});
  
  // Region selection states
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(false);

  // Initialize form data when component loads or connectionStatus changes
  useEffect(() => {
    if (connectionStatus?.connection) {
      const initialData = {
        nama_lengkap: connectionStatus.connection.bc_name || '',
        nomor_hp: connectionStatus.connection.bc_phone || connectionStatus.connection.bc_whatsapp || '',
        area: connectionStatus.connection.bc_address || '',
        desa: connectionStatus.connection.desa || '',
        kecamatan: connectionStatus.connection.kecamatan || '',
        kabupaten: connectionStatus.connection.kabupaten || '',
        propinsi: connectionStatus.connection.propinsi || '',
        kode_pos: connectionStatus.connection.kode_pos || '',
        instagram_username: connectionStatus.connection.instagram_username || '',
        facebook_username: connectionStatus.connection.facebook_username || '',
        tiktok_username: connectionStatus.connection.tiktok_username || ''
      };
      setFormData(initialData);
      setOriginalData(initialData);
    }
  }, [connectionStatus]);

  // Load provinces on component mount
  useEffect(() => {
    loadProvinces();
  }, []);

  const loadProvinces = async () => {
    try {
      setLoadingRegions(true);
      const response = await fetch('/api/regions?type=provinces');
      const data = await response.json();
      
      if (data.success) {
        setProvinces(data.data);
      }
    } catch (error) {
      console.error('Error loading provinces:', error);
    } finally {
      setLoadingRegions(false);
    }
  };

  const loadRegencies = async (provinceCode) => {
    try {
      setLoadingRegions(true);
      const response = await fetch(`/api/regions?type=regencies&code=${provinceCode}`);
      const data = await response.json();
      
      if (data.success) {
        setRegencies(data.data);
        setDistricts([]); // Reset districts when province changes
        setVillages([]); // Reset villages when province changes
      }
    } catch (error) {
      console.error('Error loading regencies:', error);
    } finally {
      setLoadingRegions(false);
    }
  };

  const loadDistricts = async (regencyCode) => {
    try {
      setLoadingRegions(true);
      const response = await fetch(`/api/regions?type=districts&code=${regencyCode}`);
      const data = await response.json();
      
      if (data.success) {
        setDistricts(data.data);
        setVillages([]); // Reset villages when regency changes
      }
    } catch (error) {
      console.error('Error loading districts:', error);
    } finally {
      setLoadingRegions(false);
    }
  };

  const loadVillages = async (districtCode) => {
    try {
      setLoadingRegions(true);
      const response = await fetch(`/api/regions?type=villages&code=${districtCode}`);
      const data = await response.json();
      
      if (data.success) {
        setVillages(data.data);
      }
    } catch (error) {
      console.error('Error loading villages:', error);
    } finally {
      setLoadingRegions(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Handle region cascading
    if (field === 'propinsi') {
      const selectedProvince = provinces.find(p => p.name === value);
      if (selectedProvince) {
        loadRegencies(selectedProvince.id);
        // Clear dependent fields
        setFormData(prev => ({
          ...prev,
          kabupaten: '',
          kecamatan: '',
          desa: ''
        }));
      }
    } else if (field === 'kabupaten') {
      const selectedRegency = regencies.find(r => r.name === value);
      if (selectedRegency) {
        loadDistricts(selectedRegency.id);
        // Clear dependent fields
        setFormData(prev => ({
          ...prev,
          kecamatan: '',
          desa: ''
        }));
      }
    } else if (field === 'kecamatan') {
      const selectedDistrict = districts.find(d => d.name === value);
      if (selectedDistrict) {
        loadVillages(selectedDistrict.id);
        // Clear dependent fields
        setFormData(prev => ({
          ...prev,
          desa: ''
        }));
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/beauty-consultant/verified', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setIsEditing(false);
        setOriginalData(formData);
        
        // Notify parent component to refresh data
        if (onDataUpdate) {
          onDataUpdate();
        }
        
        alert('Data berhasil diperbarui!');
      } else {
        throw new Error(data.error || 'Failed to update data');
      }
    } catch (error) {
      console.error('Error updating data:', error);
      alert('Gagal memperbarui data. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  if (!connectionStatus?.connection) {
    return null;
  }

  const connection = connectionStatus.connection;

  return (
    <div className="bg-white rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Detail Beauty Consultant</h3>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <PencilIcon className="w-4 h-4" />
            Edit Data
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <CheckIcon className="w-4 h-4" />
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              Batal
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 border-b pb-2">Informasi Pribadi</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.nama_lengkap}
                onChange={(e) => handleInputChange('nama_lengkap', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            ) : (
              <p className="text-lg font-semibold text-gray-900">{connection.bc_name || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.nomor_hp}
                onChange={(e) => handleInputChange('nomor_hp', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            ) : (
              <p className="text-lg text-gray-900">{connection.bc_phone || connection.bc_whatsapp || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <p className="text-lg text-gray-900">{connection.bc_level || 'N/A'}</p>
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <MapPinIcon className="w-5 h-5 text-gray-600" />
            <h4 className="font-medium text-gray-900">Alamat Lengkap</h4>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area (dari sistem)</label>
            <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">{connection.bc_address || 'N/A'}</p>
          </div>

          {isEditing ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
                <select
                  value={formData.propinsi}
                  onChange={(e) => handleInputChange('propinsi', e.target.value)}
                  disabled={loadingRegions}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Pilih Provinsi</option>
                  {provinces.map(province => (
                    <option key={province.id} value={province.name}>{province.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten/Kota</label>
                <select
                  value={formData.kabupaten}
                  onChange={(e) => handleInputChange('kabupaten', e.target.value)}
                  disabled={loadingRegions || !regencies.length}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Pilih Kabupaten/Kota</option>
                  {regencies.map(regency => (
                    <option key={regency.id} value={regency.name}>{regency.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
                <select
                  value={formData.kecamatan}
                  onChange={(e) => handleInputChange('kecamatan', e.target.value)}
                  disabled={loadingRegions || !districts.length}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Pilih Kecamatan</option>
                  {districts.map(district => (
                    <option key={district.id} value={district.name}>{district.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desa/Kelurahan</label>
                <select
                  value={formData.desa}
                  onChange={(e) => handleInputChange('desa', e.target.value)}
                  disabled={loadingRegions || !villages.length}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Pilih Desa/Kelurahan</option>
                  {villages.map(village => (
                    <option key={village.id} value={village.name}>{village.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode Pos</label>
                <input
                  type="text"
                  value={formData.kode_pos}
                  onChange={(e) => handleInputChange('kode_pos', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="12345"
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              {formData.propinsi && <p className="text-sm"><span className="font-medium">Provinsi:</span> {formData.propinsi}</p>}
              {formData.kabupaten && <p className="text-sm"><span className="font-medium">Kabupaten/Kota:</span> {formData.kabupaten}</p>}
              {formData.kecamatan && <p className="text-sm"><span className="font-medium">Kecamatan:</span> {formData.kecamatan}</p>}
              {formData.desa && <p className="text-sm"><span className="font-medium">Desa/Kelurahan:</span> {formData.desa}</p>}
              {formData.kode_pos && <p className="text-sm"><span className="font-medium">Kode Pos:</span> {formData.kode_pos}</p>}
              {!formData.propinsi && !formData.kabupaten && !formData.kecamatan && !formData.desa && (
                <p className="text-sm text-gray-500 italic">Detail alamat belum dilengkapi</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Social Media Section */}
      <div className="pt-6 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Media Sosial (Opsional)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.instagram_username}
                onChange={(e) => handleInputChange('instagram_username', e.target.value)}
                placeholder="@username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            ) : (
              <p className="text-sm text-gray-600">{formData.instagram_username || 'Belum diisi'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.facebook_username}
                onChange={(e) => handleInputChange('facebook_username', e.target.value)}
                placeholder="username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            ) : (
              <p className="text-sm text-gray-600">{formData.facebook_username || 'Belum diisi'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TikTok</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.tiktok_username}
                onChange={(e) => handleInputChange('tiktok_username', e.target.value)}
                placeholder="@username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            ) : (
              <p className="text-sm text-gray-600">{formData.tiktok_username || 'Belum diisi'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Terhubung pada: {new Date(connection.created_at).toLocaleDateString('id-ID')}</span>
          {connection.verified_at && (
            <span>Diverifikasi pada: {new Date(connection.verified_at).toLocaleDateString('id-ID')}</span>
          )}
        </div>
      </div>
    </div>
  );
}