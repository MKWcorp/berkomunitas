'use client';

import { useState, useEffect, useRef } from 'react';
import SearchableDropdown from './SearchableDropdown';

export default function WilayahForm({ 
  initialValues = {},
  onAddressChange,
  required = false 
}) {
  // State for form values
  const [formData, setFormData] = useState({
    provinsi: initialValues.provinsi || '',
    kabupaten: initialValues.kabupaten || '',
    kecamatan: initialValues.kecamatan || '',
    desa: initialValues.desa || '',
    alamat_lengkap: initialValues.alamat_lengkap || '',
    kode_pos: initialValues.kode_pos || ''
  });

  // State for dropdown options
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  // Track previous values to avoid unnecessary resets
  const prevProvinsi = useRef(formData.provinsi);
  const prevKabupaten = useRef(formData.kabupaten);
  const prevKecamatan = useRef(formData.kecamatan);

  // API Base URL
  const API_BASE_URL = '/api/wilayah';

  // Load provinces on component mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Load regencies when province changes
  useEffect(() => {
    if (formData.provinsi && formData.provinsi !== prevProvinsi.current) {
      const provinceOption = provinces.find(p => p.name === formData.provinsi);
      if (provinceOption) {
        loadRegencies(provinceOption.id);
      }
      // Reset dependent fields when province changes
      const newFormData = {
        ...formData,
        kabupaten: '',
        kecamatan: '',
        desa: ''
      };
      updateFormDataInternal(newFormData);
      setRegencies([]);
      setDistricts([]);
      setVillages([]);
      prevProvinsi.current = formData.provinsi;
      
      // Auto-update alamat_lengkap after reset
      updateAlamatLengkap(newFormData);
    }
  }, [formData.provinsi, provinces]);

  // Load districts when regency changes
  useEffect(() => {
    if (formData.kabupaten && formData.kabupaten !== prevKabupaten.current) {
      const regencyOption = regencies.find(r => r.name === formData.kabupaten);
      if (regencyOption) {
        loadDistricts(regencyOption.id);
      }
      // Reset dependent fields when regency changes
      const newFormData = {
        ...formData,
        kecamatan: '',
        desa: ''
      };
      updateFormDataInternal(newFormData);
      setDistricts([]);
      setVillages([]);
      prevKabupaten.current = formData.kabupaten;
      
      // Auto-update alamat_lengkap after reset
      updateAlamatLengkap(newFormData);
    }
  }, [formData.kabupaten, regencies]);

  // Load villages when district changes
  useEffect(() => {
    if (formData.kecamatan && formData.kecamatan !== prevKecamatan.current) {
      const districtOption = districts.find(d => d.name === formData.kecamatan);
      if (districtOption) {
        loadVillages(districtOption.id);
      }
      // Reset dependent fields when district changes
      const newFormData = {
        ...formData,
        desa: ''
      };
      updateFormDataInternal(newFormData);
      setVillages([]);
      prevKecamatan.current = formData.kecamatan;
      
      // Auto-update alamat_lengkap after reset
      updateAlamatLengkap(newFormData);
    }
  }, [formData.kecamatan, districts]);



  // API loading functions
  const loadProvinces = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}?endpoint=/provinces.json`);
      const data = await response.json();
      setProvinces(data || []);
    } catch (error) {
      console.error('Error loading provinces:', error);
    }
  };

  const loadRegencies = async (provinceId) => {
    try {
      const response = await fetch(`${API_BASE_URL}?endpoint=/regencies/${provinceId}.json`);
      const data = await response.json();
      setRegencies(data || []);
    } catch (error) {
      console.error('Error loading regencies:', error);
    }
  };

  const loadDistricts = async (regencyId) => {
    try {
      const response = await fetch(`${API_BASE_URL}?endpoint=/districts/${regencyId}.json`);
      const data = await response.json();
      setDistricts(data || []);
    } catch (error) {
      console.error('Error loading districts:', error);
    }
  };

  const loadVillages = async (districtId) => {
    try {
      const response = await fetch(`${API_BASE_URL}?endpoint=/villages/${districtId}.json`);
      const data = await response.json();
      setVillages(data || []);
    } catch (error) {
      console.error('Error loading villages:', error);
    }
  };

  // Handle form field changes
  const handleFieldChange = (fieldName, value) => {
    const newFormData = {
      ...formData,
      [fieldName]: value
    };

    // Auto-fill alamat_lengkap based on selected regions
    if (['provinsi', 'kabupaten', 'kecamatan', 'desa', 'kode_pos'].includes(fieldName)) {
      const addressParts = [
        fieldName === 'desa' ? value : newFormData.desa,
        fieldName === 'kecamatan' ? value : newFormData.kecamatan,
        fieldName === 'kabupaten' ? value : newFormData.kabupaten,
        fieldName === 'provinsi' ? value : newFormData.provinsi,
        fieldName === 'kode_pos' ? value : newFormData.kode_pos
      ].filter(Boolean);
      
      if (addressParts.length > 0) {
        newFormData.alamat_lengkap = addressParts.join(', ');
      }
    }

    setFormData(newFormData);
    
    // Notify parent immediately
    if (onAddressChange) {
      onAddressChange(newFormData);
    }
  };

  // Internal function to update state without notifying parent (for resets)
  const updateFormDataInternal = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Helper function to update alamat_lengkap based on current form data
  const updateAlamatLengkap = (currentFormData) => {
    const addressParts = [
      currentFormData.desa,
      currentFormData.kecamatan,
      currentFormData.kabupaten,
      currentFormData.provinsi,
      currentFormData.kode_pos
    ].filter(Boolean);
    
    if (addressParts.length > 0) {
      const newFormData = {
        ...currentFormData,
        alamat_lengkap: addressParts.join(', ')
      };
      setFormData(newFormData);
      
      // Notify parent
      if (onAddressChange) {
        onAddressChange(newFormData);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    handleFieldChange(name, value);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Alamat Lengkap
      </h3>
      
      {/* Mobile Style - All fields stacked vertically */}
      <div className="space-y-4">
        <SearchableDropdown
          label="Provinsi"
          value={formData.provinsi}
          onChange={(value) => handleFieldChange('provinsi', value)}
          options={provinces}
          placeholder="Ketik provinsi..."
          required={required}
          allowCustom={true}
        />
        
        <SearchableDropdown
          label="Kabupaten/Kota"
          value={formData.kabupaten}
          onChange={(value) => handleFieldChange('kabupaten', value)}
          options={regencies}
          placeholder="Ketik kabupaten..."
          required={required}
          allowCustom={true}
        />
        
        <SearchableDropdown
          label="Kecamatan"
          value={formData.kecamatan}
          onChange={(value) => handleFieldChange('kecamatan', value)}
          options={districts}
          placeholder="Ketik kecamatan..."
          required={required}
          allowCustom={true}
        />
        
        <SearchableDropdown
          label="Desa/Kelurahan"
          value={formData.desa}
          onChange={(value) => handleFieldChange('desa', value)}
          options={villages}
          placeholder="Ketik desa..."
          required={required}
          allowCustom={true}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alamat Detail {required && <span className="text-red-500">*</span>}
          </label>
          <textarea
            name="alamat_lengkap"
            value={formData.alamat_lengkap}
            onChange={handleInputChange}
            placeholder="Alamat akan otomatis terisi berdasarkan pilihan wilayah di atas. Anda dapat mengedit atau menambahkan detail seperti: Jalan, RT/RW, No. Rumah, Patokan, dll..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[100px]"
            required={required}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kode Pos
          </label>
          <input
            type="text"
            name="kode_pos"
            value={formData.kode_pos}
            onChange={handleInputChange}
            placeholder="12345"
            maxLength="5"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}