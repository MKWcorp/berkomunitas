'use client';

import { useState, useEffect } from 'react';

export default function WilayahDropdown({ 
  onAddressChange, 
  initialValues = {},
  required = false,
  className = "" 
}) {
  // State for dropdown options
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  // State for selected values
  const [selectedProvince, setSelectedProvince] = useState(initialValues.provinceId || '');
  const [selectedRegency, setSelectedRegency] = useState(initialValues.regencyId || '');
  const [selectedDistrict, setSelectedDistrict] = useState(initialValues.districtId || '');
  const [selectedVillage, setSelectedVillage] = useState(initialValues.villageId || '');

  // Loading states
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // API Base URL - Using local Next.js API route to bypass CORS
  const API_BASE_URL = '/api/wilayah';

  // Fetch provinces on component mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  // Reset dependent dropdowns when parent changes
  useEffect(() => {
    if (selectedProvince) {
      fetchRegencies(selectedProvince);
      setSelectedRegency('');
      setSelectedDistrict('');
      setSelectedVillage('');
      setDistricts([]);
      setVillages([]);
    } else {
      setRegencies([]);
      setDistricts([]);
      setVillages([]);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedRegency) {
      fetchDistricts(selectedRegency);
      setSelectedDistrict('');
      setSelectedVillage('');
      setVillages([]);
    } else {
      setDistricts([]);
      setVillages([]);
    }
  }, [selectedRegency]);

  useEffect(() => {
    if (selectedDistrict) {
      fetchVillages(selectedDistrict);
      setSelectedVillage('');
    } else {
      setVillages([]);
    }
  }, [selectedDistrict]);

  // Notify parent component of address changes
  useEffect(() => {
    const selectedProvinceData = provinces.find(p => p.id === selectedProvince);
    const selectedRegencyData = regencies.find(r => r.id === selectedRegency);
    const selectedDistrictData = districts.find(d => d.id === selectedDistrict);
    const selectedVillageData = villages.find(v => v.id === selectedVillage);

    if (onAddressChange) {
      onAddressChange({
        province: selectedProvinceData || null,
        regency: selectedRegencyData || null,
        district: selectedDistrictData || null,
        village: selectedVillageData || null,
        isComplete: !!(selectedProvince && selectedRegency && selectedDistrict && selectedVillage)
      });
    }
  }, [selectedProvince, selectedRegency, selectedDistrict, selectedVillage, provinces, regencies, districts, villages]);

  // API fetch functions
  const fetchProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const response = await fetch(`${API_BASE_URL}?endpoint=/provinces.json`);
      const data = await response.json();
      setProvinces(data);
    } catch (error) {
      console.error('Error fetching provinces:', error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const fetchRegencies = async (provinceId) => {
    setLoadingRegencies(true);
    try {
      const response = await fetch(`${API_BASE_URL}?endpoint=/regencies/${provinceId}.json`);
      const data = await response.json();
      setRegencies(data);
    } catch (error) {
      console.error('Error fetching regencies:', error);
    } finally {
      setLoadingRegencies(false);
    }
  };

  const fetchDistricts = async (regencyId) => {
    setLoadingDistricts(true);
    try {
      const response = await fetch(`${API_BASE_URL}?endpoint=/districts/${regencyId}.json`);
      const data = await response.json();
      setDistricts(data);
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchVillages = async (districtId) => {
    setLoadingVillages(true);
    try {
      const response = await fetch(`${API_BASE_URL}?endpoint=/villages/${districtId}.json`);
      const data = await response.json();
      setVillages(data);
    } catch (error) {
      console.error('Error fetching villages:', error);
    } finally {
      setLoadingVillages(false);
    }
  };

  // Select component style
  const selectClass = `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${className}`;
  const loadingSelectClass = `${selectClass} opacity-50 cursor-not-allowed`;

  return (
    <div className="space-y-4">
      {/* Provinsi */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Provinsi {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedProvince}
          onChange={(e) => setSelectedProvince(e.target.value)}
          className={loadingProvinces ? loadingSelectClass : selectClass}
          disabled={loadingProvinces}
          required={required}
        >
          <option value="">
            {loadingProvinces ? 'Memuat provinsi...' : 'Pilih Provinsi'}
          </option>
          {provinces.map((province) => (
            <option key={province.id} value={province.id}>
              {province.name}
            </option>
          ))}
        </select>
      </div>

      {/* Kabupaten/Kota */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kabupaten/Kota {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedRegency}
          onChange={(e) => setSelectedRegency(e.target.value)}
          className={!selectedProvince || loadingRegencies ? loadingSelectClass : selectClass}
          disabled={!selectedProvince || loadingRegencies}
          required={required}
        >
          <option value="">
            {!selectedProvince 
              ? 'Pilih provinsi terlebih dahulu' 
              : loadingRegencies 
                ? 'Memuat kabupaten/kota...' 
                : 'Pilih Kabupaten/Kota'
            }
          </option>
          {regencies.map((regency) => (
            <option key={regency.id} value={regency.id}>
              {regency.name}
            </option>
          ))}
        </select>
      </div>

      {/* Kecamatan */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kecamatan {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className={!selectedRegency || loadingDistricts ? loadingSelectClass : selectClass}
          disabled={!selectedRegency || loadingDistricts}
          required={required}
        >
          <option value="">
            {!selectedRegency 
              ? 'Pilih kabupaten/kota terlebih dahulu' 
              : loadingDistricts 
                ? 'Memuat kecamatan...' 
                : 'Pilih Kecamatan'
            }
          </option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>
      </div>

      {/* Desa/Kelurahan */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Desa/Kelurahan {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedVillage}
          onChange={(e) => setSelectedVillage(e.target.value)}
          className={!selectedDistrict || loadingVillages ? loadingSelectClass : selectClass}
          disabled={!selectedDistrict || loadingVillages}
          required={required}
        >
          <option value="">
            {!selectedDistrict 
              ? 'Pilih kecamatan terlebih dahulu' 
              : loadingVillages 
                ? 'Memuat desa/kelurahan...' 
                : 'Pilih Desa/Kelurahan'
            }
          </option>
          {villages.map((village) => (
            <option key={village.id} value={village.id}>
              {village.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}