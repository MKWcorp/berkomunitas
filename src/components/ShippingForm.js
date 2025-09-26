'use client';
import { useState, useEffect } from 'react';
import { TruckIcon, MapPinIcon, PhoneIcon, UserIcon } from '@heroicons/react/24/outline';

export default function ShippingForm({ onSubmit, initialData = null, isLoading = false }) {
  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_phone: '',
    shipping_address: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        recipient_name: initialData.recipient_name || '',
        recipient_phone: initialData.recipient_phone || '',
        shipping_address: initialData.shipping_address || '',
        notes: initialData.notes || ''
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.recipient_name?.trim()) {
      newErrors.recipient_name = 'Nama penerima harus diisi';
    }
    
    if (!formData.recipient_phone?.trim()) {
      newErrors.recipient_phone = 'Nomor telepon harus diisi';
    } else if (!/^(\+62|62|0)[0-9]{9,13}$/.test(formData.recipient_phone.replace(/[\s-]/g, ''))) {
      newErrors.recipient_phone = 'Format nomor telepon tidak valid';
    }
    
    if (!formData.shipping_address?.trim()) {
      newErrors.shipping_address = 'Alamat pengiriman harus diisi';
    } else if (formData.shipping_address.length < 20) {
      newErrors.shipping_address = 'Alamat harus lebih detail (minimal 20 karakter)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-blue-800 mb-2">
          <TruckIcon className="w-5 h-5" />
          <span className="font-medium">Informasi Pengiriman</span>
        </div>
        <p className="text-sm text-blue-600">
          Mohon isi data pengiriman dengan benar. Pastikan alamat lengkap untuk memudahkan proses pengiriman.
        </p>
      </div>

      {/* Recipient Name */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
          <UserIcon className="w-4 h-4" />
          <span>Nama Penerima *</span>
        </label>
        <input
          type="text"
          value={formData.recipient_name}
          onChange={(e) => handleChange('recipient_name', e.target.value)}
          className={`
            w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${errors.recipient_name ? 'border-red-500' : 'border-gray-300'}
          `}
          placeholder="Masukkan nama lengkap penerima"
          disabled={isLoading}
        />
        {errors.recipient_name && (
          <p className="mt-1 text-sm text-red-600">{errors.recipient_name}</p>
        )}
      </div>

      {/* Recipient Phone */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
          <PhoneIcon className="w-4 h-4" />
          <span>Nomor Telepon *</span>
        </label>
        <input
          type="tel"
          value={formData.recipient_phone}
          onChange={(e) => handleChange('recipient_phone', e.target.value)}
          className={`
            w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${errors.recipient_phone ? 'border-red-500' : 'border-gray-300'}
          `}
          placeholder="08123456789 atau +6281234567890"
          disabled={isLoading}
        />
        {errors.recipient_phone && (
          <p className="mt-1 text-sm text-red-600">{errors.recipient_phone}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Format: 08xxx atau +62xxx (akan digunakan untuk koordinasi pengiriman)
        </p>
      </div>

      {/* Shipping Address */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
          <MapPinIcon className="w-4 h-4" />
          <span>Alamat Pengiriman *</span>
        </label>
        <textarea
          value={formData.shipping_address}
          onChange={(e) => handleChange('shipping_address', e.target.value)}
          rows={4}
          className={`
            w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${errors.shipping_address ? 'border-red-500' : 'border-gray-300'}
          `}
          placeholder="Masukkan alamat lengkap:&#10;Jalan, No. Rumah, RT/RW&#10;Kelurahan, Kecamatan&#10;Kota, Provinsi, Kode Pos"
          disabled={isLoading}
        />
        {errors.shipping_address && (
          <p className="mt-1 text-sm text-red-600">{errors.shipping_address}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Semakin detail alamat, semakin mudah proses pengiriman. Minimal 20 karakter.
        </p>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Catatan Tambahan
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Patokan alamat, warna pagar, atau informasi tambahan lainnya (opsional)"
          disabled={isLoading}
        />
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className={`
            w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors
            ${isLoading 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          `}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent"></div>
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <TruckIcon className="w-4 h-4" />
              <span>Konfirmasi Data Pengiriman</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-sm text-yellow-800">
          <strong>Catatan:</strong> Setelah konfirmasi, data pengiriman tidak dapat diubah. 
          Pastikan semua informasi sudah benar sebelum melanjutkan.
        </p>
      </div>
    </form>
  );
}