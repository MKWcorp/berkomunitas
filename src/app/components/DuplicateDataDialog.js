'use client';
import { useState } from 'react';

export default function DuplicateDataDialog({ duplicates, isOpen, onClose, onAction }) {
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');

  if (!isOpen || !duplicates || duplicates.length === 0) {
    return null;
  }

  const handleAction = async (clerkId, action) => {
    setLoading(true);
    setSelectedAction(action);
    
    try {
      await onAction(clerkId, action);
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setLoading(false);
      setSelectedAction('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Data Duplikat Ditemukan!
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Data yang Anda masukkan sudah dimiliki oleh akun lain. Silakan pilih tindakan yang ingin dilakukan:
          </p>
        </div>

        <div className="space-y-4">
          {duplicates.map((duplicate, index) => (
            <div key={index} className="border rounded-lg p-4 bg-yellow-50">
              <div className="mb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 mb-1">
                      {duplicate.type === 'whatsapp' ? 'Nomor WhatsApp' : 
                       `${duplicate.platform} (${duplicate.username})`}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Sudah dimiliki oleh: <strong>{duplicate.existing_user.nama_lengkap}</strong>
                    </p>
                    <p className="text-sm text-gray-500">
                      Email: {duplicate.existing_user.masked_email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleAction(duplicate.existing_user.clerk_id, 'link_email')}
                  disabled={loading}
                  className={`w-full px-4 py-2 text-sm rounded-lg transition-colors ${
                    loading && selectedAction === 'link_email'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loading && selectedAction === 'link_email' 
                    ? 'Menambahkan...' 
                    : 'Tambahkan email saya ke akun tersebut'
                  }
                </button>
                
                <button
                  onClick={() => handleAction(duplicate.existing_user.clerk_id, 'merge')}
                  disabled={loading}
                  className={`w-full px-4 py-2 text-sm rounded-lg transition-colors ${
                    loading && selectedAction === 'merge'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {loading && selectedAction === 'merge' 
                    ? 'Menggabungkan...' 
                    : 'Gabungkan dengan akun tersebut (merge data & poin)'
                  }
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              loading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Batal
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Info:</strong> Tambahkan email akan menambahkan alamat email Anda ke akun yang sudah ada. 
            Merge akan menggabungkan seluruh data dan poin loyalty Anda ke akun tersebut.
          </p>
        </div>
      </div>
    </div>
  );
}
