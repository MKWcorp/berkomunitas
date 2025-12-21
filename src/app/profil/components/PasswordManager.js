'use client';
import { useState } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { 
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon 
} from '@heroicons/react/24/outline';

export default function PasswordManager() {
  const { user } = useSSOUser();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage('❌ Password baru dan konfirmasi password tidak cocok.');
      return;
    }

    if (passwords.newPassword.length < 8) {
      setMessage('❌ Password baru minimal 8 karakter.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Using Clerk's user.updatePassword() method
      await user.updatePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });

      setMessage('✅ Password berhasil diubah!');
      
      // Reset form
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      
      if (error.errors?.[0]?.code === 'form_password_incorrect') {
        setMessage('❌ Password saat ini tidak benar.');
      } else if (error.errors?.[0]?.code === 'form_password_pwned') {
        setMessage('❌ Password baru terlalu umum dan tidak aman. Gunakan password yang lebih kuat.');
      } else {
        setMessage(`❌ Gagal mengubah password: ${error.errors?.[0]?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if user has a password set
  const hasPassword = user?.passwordEnabled;

  if (!user) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <LockClosedIcon className="w-6 h-6 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">Kelola Password</h3>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.includes('✅') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {hasPassword ? (
        <>
          {/* Change Password Form */}
          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Password Saat Ini <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 bg-white/70 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Masukkan password saat ini"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Password Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 bg-white/70 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Masukkan password baru"
                  required
                  disabled={loading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Konfirmasi Password Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 bg-white/70 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Konfirmasi password baru"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-2 font-medium">Persyaratan Password:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className={`${passwords.newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                  • Minimal 8 karakter
                </li>
                <li className={`${/[A-Z]/.test(passwords.newPassword) ? 'text-green-600' : ''}`}>
                  • Setidaknya 1 huruf besar
                </li>
                <li className={`${/[a-z]/.test(passwords.newPassword) ? 'text-green-600' : ''}`}>
                  • Setidaknya 1 huruf kecil
                </li>
                <li className={`${/\d/.test(passwords.newPassword) ? 'text-green-600' : ''}`}>
                  • Setidaknya 1 angka
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Mengubah Password...
                </>
              ) : (
                'Ubah Password'
              )}
            </button>
          </form>
        </>
      ) : (
        <>
          {/* No Password Set */}
          <div className="text-center py-6">
            <LockClosedIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-700 mb-2">Password Belum Diatur</h4>
            <p className="text-gray-600 mb-4">
              Anda login menggunakan akun sosial media. Untuk keamanan tambahan, 
              Anda dapat mengatur password untuk akun ini.
            </p>
            <p className="text-sm text-blue-600">
              💡 Klik foto profil → "Pengaturan" → "Password" untuk mengatur password
            </p>
          </div>
        </>
      )}

      {/* Security Tips */}
      <div className="mt-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-xs text-yellow-800">
          <strong>🔒 Tips Keamanan:</strong> Gunakan password yang unik dan kuat. 
          Jangan gunakan password yang sama dengan akun lain. 
          Pertimbangkan untuk menggunakan password manager.
        </p>
      </div>
    </div>
  );
}
