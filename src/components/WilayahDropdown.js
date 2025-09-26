import { useState, useEffect } from 'react';

// Data provinsi Indonesia sederhana
const PROVINSI_DATA = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi', 
  'Sumatera Selatan', 'Bangka Belitung', 'Bengkulu', 'Lampung', 'DKI Jakarta', 
  'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Banten',
  'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Kalimantan Barat',
  'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
  'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara',
  'Gorontalo', 'Sulawesi Barat', 'Maluku', 'Maluku Utara', 'Papua', 'Papua Barat'
];

const WilayahDropdown = ({ 
  type, 
  value, 
  onChange, 
  parentCode = '',
  className = "", 
  placeholder = "Pilih..." 
}) => {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    let newOptions = [];

    switch (type) {
      case 'provinsi':
        newOptions = PROVINSI_DATA;
        break;
      case 'kabupaten':
        newOptions = ['Kabupaten/Kota akan dimuat setelah pilih provinsi'];
        break;
      case 'kecamatan':
        newOptions = ['Kecamatan akan dimuat setelah pilih kabupaten'];
        break;
      case 'desa':
        newOptions = ['Desa/Kelurahan akan dimuat setelah pilih kecamatan'];
        break;
      default:
        newOptions = [];
    }

    setOptions(newOptions);
  }, [type, parentCode]);

  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${className}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default WilayahDropdown;