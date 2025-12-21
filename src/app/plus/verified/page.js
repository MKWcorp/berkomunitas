'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { useRouter } from 'next/navigation';
import WilayahForm from '../../components/WilayahForm';
import { 
  UserIcon, 
  PhoneIcon, 
  MapPinIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function BerkomunitasPlusVerifiedPage() {
  const { user, isLoaded } = useSSOUser();
  const router = useRouter();
  
  const [member, setMember] = useState(null);
  const [privileges, setPrivileges] = useState([]);
  const [verifiedData, setVerifiedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Check if user is BerkomunitasPlus member
  useEffect(() => {
    if (isLoaded && user) {
      checkMembershipStatus();
    } else if (isLoaded && !user) {
      router.push('/masuk');
    }
  }, [isLoaded, user]);

  // Handle address form changes
  const handleAddressChange = useCallback((addressData) => {
    setEditData(prev => ({
      ...prev,
      propinsi: addressData.provinsi,
      kabupaten: addressData.kabupaten,
      kecamatan: addressData.kecamatan,
      desa: addressData.desa,
      alamat_lengkap: addressData.alamat_lengkap,
      kode_pos: addressData.kode_pos
    }));
  }, []);

  const checkMembershipStatus = async () => {
    try {
      setLoading(true);
      
      // Get member data
      const memberResponse = await fetch('/api/members/current', {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!memberResponse.ok) {
        throw new Error('Failed to fetch member data');
      }

      const memberData = await memberResponse.json();
      if (!memberData.success) {
        throw new Error(memberData.message || 'Failed to fetch member data');
      }

      setMember(memberData.member);

      // Get privileges data
      const privilegesResponse = await fetch(`/api/user/privileges?member_id=${memberData.member.id}`, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!privilegesResponse.ok) {
        throw new Error('Failed to fetch privileges data');
      }

      const privilegesData = await privilegesResponse.json();
      setPrivileges(privilegesData.privileges || []);

      // Load verified data (middleware already handled access control)
      await loadVerifiedData();

    } catch (error) {
      console.error('Error checking membership status:', error);
      setMessage({ type: 'error', text: 'Gagal memverifikasi status keanggotaan' });
      setLoading(false);
    }
  };

  const loadVerifiedData = async () => {
    try {
      // Use the beauty-consultant/verified endpoint
      const response = await fetch('/api/beauty-consultant/verified');
      
      if (response.ok) {
        const result = await response.json();
        
        // Extract data from the response
        const verifiedData = result.data;
        setVerifiedData(verifiedData);
        
        // Set form data with proper field mapping
        setEditData({
          nama_lengkap: verifiedData?.nama || '',
          nomor_hp: verifiedData?.nomor_hp || '',
          area: verifiedData?.area || '',
          desa: verifiedData?.desa || '',
          kecamatan: verifiedData?.kecamatan || '',
          kabupaten: verifiedData?.kabupaten || '',
          propinsi: verifiedData?.propinsi || '',
          kode_pos: verifiedData?.kode_pos || '',
          alamat_lengkap: verifiedData?.alamat_detail || '', // Map from alamat_detail column
          instagram_username: verifiedData?.instagram_link || '',
          facebook_username: verifiedData?.facebook_link || '',
          tiktok_username: verifiedData?.tiktok_link || '',
        });
      } else if (response.status === 404) {
        // No verified data yet, that's ok
        setVerifiedData(null);
        setEditData({
          nama_lengkap: member?.nama_lengkap || '',
          nomor_hp: '',
          area: '',
          desa: '',
          kecamatan: '',
          kabupaten: '',
          propinsi: '',
          kode_pos: '',
          alamat_lengkap: '', // Add alamat_lengkap field
          instagram_username: '',
          facebook_username: '',
          tiktok_username: '',
        });
      } else {
        throw new Error('Failed to load verified data');
      }
    } catch (error) {
      console.error('Error loading verified data:', error);
      setMessage({ type: 'error', text: 'Gagal memuat data terverifikasi' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      setMessage({ type: '', text: '' });

      // Use the beauty-consultant/verified PUT endpoint
      const response = await fetch('/api/beauty-consultant/verified', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: editData.nama_lengkap,
          nomor_hp: editData.nomor_hp,
          area: editData.area,
          desa: editData.desa,
          kecamatan: editData.kecamatan,
          kabupaten: editData.kabupaten,
          propinsi: editData.propinsi,
          kode_pos: editData.kode_pos,
          alamat_lengkap: editData.alamat_lengkap, // Add alamat_lengkap to payload
          instagram_username: editData.instagram_username,
          facebook_username: editData.facebook_username,
          tiktok_username: editData.tiktok_username,
        })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Data berhasil diperbarui!' });
        // Reload verified data
        await loadVerifiedData();
        setIsEditing(false);
      } else {
        setMessage({ type: 'error', text: result.error || 'Gagal menyimpan data' });
      }
    } catch (error) {
      console.error('Error saving verified data:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat menyimpan data' });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset edit data to current verified data
    if (verifiedData) {
      setEditData({
        nama_lengkap: verifiedData?.nama || '',
        nomor_hp: verifiedData?.nomor_hp || '',
        area: verifiedData?.area || '',
        desa: verifiedData?.desa || '',
        kecamatan: verifiedData?.kecamatan || '',
        kabupaten: verifiedData?.kabupaten || '',
        propinsi: verifiedData?.propinsi || '',
        kode_pos: verifiedData?.kode_pos || '',
        alamat_lengkap: verifiedData?.alamat_detail || '', // Add alamat_lengkap reset
        instagram_username: verifiedData?.instagram_link || '',
        facebook_username: verifiedData?.facebook_link || '',
        tiktok_username: verifiedData?.tiktok_link || '',
      });
    }
    setMessage({ type: '', text: '' });
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-white font-semibold mb-4">
              <span className="mr-2">⭐</span>
              BerkomunitasPlus - Data Terverifikasi
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Kelola Data Verifikasi Anda
            </h1>
            <p className="text-gray-600">
              Sebagai member BerkomunitasPlus, Anda dapat mengelola dan memperbarui data verifikasi Anda
            </p>
          </div>

          {/* Message Alert */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-1">
                    Data Pribadi Terverifikasi
                  </h2>
                  <p className="text-sm text-gray-600">
                    {verifiedData 
                      ? `Terakhir diperbarui: ${new Date(verifiedData.updated_at).toLocaleDateString('id-ID')}`
                      : 'Belum ada data terverifikasi'
                    }
                  </p>
                </div>
              </div>

              {/* Data Form/Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    Informasi Pribadi
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Lengkap
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.nama_lengkap}
                          onChange={(e) => setEditData({...editData, nama_lengkap: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Masukkan nama lengkap"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-800">
                          {verifiedData?.nama || 'Belum diisi'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nomor HP
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.nomor_hp}
                          onChange={(e) => setEditData({...editData, nomor_hp: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="08XXXXXXXXXX"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-800">
                          {verifiedData?.nomor_hp || 'Belum diisi'}
                        </div>
                      )}
                    </div>

                    {/* Area/Wilayah */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Area
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.area}
                          onChange={(e) => setEditData({...editData, area: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Masukkan area"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-800">
                          {verifiedData?.area || 'Belum diisi'}
                        </div>
                      )}
                    </div>

                    {/* Address Section */}
                    {isEditing ? (
                      <div className="col-span-2">
                        <WilayahForm
                          initialValues={{
                            provinsi: editData.propinsi || '',
                            kabupaten: editData.kabupaten || '',
                            kecamatan: editData.kecamatan || '',
                            desa: editData.desa || '',
                            alamat_lengkap: editData.alamat_lengkap || '',
                            kode_pos: editData.kode_pos || ''
                          }}
                          onAddressChange={handleAddressChange}
                          required={false}
                        />
                      </div>
                    ) : (
                      <div className="col-span-2 space-y-4">
                        {/* Provinsi Display */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Provinsi
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-800">
                            {verifiedData?.propinsi || 'Belum diisi'}
                          </div>
                        </div>

                        {/* Kabupaten Display */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kabupaten/Kota
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-800">
                            {verifiedData?.kabupaten || 'Belum diisi'}
                          </div>
                        </div>

                        {/* Kecamatan Display */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kecamatan
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-800">
                            {verifiedData?.kecamatan || 'Belum diisi'}
                          </div>
                        </div>

                        {/* Desa Display */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Desa/Kelurahan
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-800">
                            {verifiedData?.desa || 'Belum diisi'}
                          </div>
                        </div>

                        {/* Alamat Lengkap Display */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Alamat Lengkap
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-800">
                            {verifiedData?.alamat_detail || 'Belum diisi'}
                          </div>
                        </div>

                        {/* Kode Pos Display */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kode Pos
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-800">
                            {verifiedData?.kode_pos || 'Belum diisi'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Media */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    Media Sosial
                  </h3>
                  <div className="space-y-4">
                    {[
                      { 
                        key: 'instagram_username', 
                        label: 'Instagram - Link Profil', 
                        placeholder: 'https://instagram.com/username', 
                        icon: <i className="fab fa-instagram text-pink-500"></i>
                      },
                      { 
                        key: 'facebook_username', 
                        label: 'Facebook - Link Profil', 
                        placeholder: 'https://facebook.com/username', 
                        icon: <i className="fab fa-facebook text-blue-600"></i>
                      },
                      { 
                        key: 'tiktok_username', 
                        label: 'TikTok - Link Profil', 
                        placeholder: 'https://tiktok.com/@username', 
                        icon: <i className="fab fa-tiktok text-black"></i>
                      }
                    ].map((social) => (
                      <div key={social.key}>
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                          <span className="mr-2">{social.icon}</span>
                          {social.label}
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData[social.key]}
                            onChange={(e) => setEditData({...editData, [social.key]: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={social.placeholder}
                          />
                        ) : (
                          <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-800">
                            {(() => {
                              switch(social.key) {
                                case 'instagram_username':
                                  return verifiedData?.instagram_link || 'Belum diisi';
                                case 'facebook_username':
                                  return verifiedData?.facebook_link || 'Belum diisi';
                                case 'tiktok_username':
                                  return verifiedData?.tiktok_link || 'Belum diisi';
                                default:
                                  return 'Belum diisi';
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center pt-6">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    <PencilIcon className="w-5 h-5 mr-2" />
                    {verifiedData ? 'Edit Data' : 'Tambah Data'}
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saveLoading}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium disabled:opacity-50 shadow-lg hover:shadow-xl"
                    >
                      <CheckIcon className="w-5 h-5 mr-2" />
                      {saveLoading ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                    >
                      <XMarkIcon className="w-5 h-5 mr-2" />
                      Batal
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}