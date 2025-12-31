'use client';

import { useState } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  KeyIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

export default function SetPasswordForm() {
  const { user } = useSSOUser();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });

  // Check if user already has a password
  const hasPassword = user?.passwordEnabled;

  // Password strength checker
  const checkPasswordStrength = (password) => {
    const checks = [
      { test: password.length >= 8, text: 'Minimal 8 karakter' },
      { test: /[a-z]/.test(password), text: 'Huruf kecil' },
      { test: /[A-Z]/.test(password), text: 'Huruf besar' },
      { test: /\d/.test(password), text: 'Angka' },
      { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), text: 'Simbol' }
    ];

    const score = checks.filter(check => check.test).length;
    const feedback = checks.map(check => ({
      text: check.text,
      passed: check.test
    }));

    setPasswordStrength({ score, feedback });
    return score;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Check password strength for new password
    if (field === 'newPassword') {
      checkPasswordStrength(value);
    }
    
    // Clear messages when user types
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    // Check if new password is provided
    if (!formData.newPassword) {
      setMessage({ type: 'error', text: 'Password baru harus diisi' });
      return false;
    }

    // Check password strength
    if (passwordStrength.score < 3) {
      setMessage({ type: 'error', text: 'Password terlalu lemah. Minimal harus memenuhi 3 kriteria keamanan.' });
      return false;
    }

    // Check password confirmation
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok' });
      return false;
    }

    // If user has password, current password is required
    if (hasPassword && !formData.currentPassword) {
      setMessage({ type: 'error', text: 'Password saat ini harus diisi' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Prepare update parameters based on whether user has existing password
      const updateParams = {
        password: formData.newPassword
      };

      // If user has existing password, include current password for verification
      if (hasPassword) {
        updateParams.currentPassword = formData.currentPassword;
      }

      // Call user.update() with appropriate parameters
      await user.update(updateParams);

      setMessage({ 
        type: 'success', 
        text: hasPassword 
          ? 'Password berhasil diperbarui!' 
          : 'Password berhasil dibuat!'
      });

      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordStrength({ score: 0, feedback: [] });

    } catch (error) {
      console.error('Password update error:', error);
      
      // Handle specific Clerk errors
      if (error.errors && error.errors.length > 0) {
        const errorMsg = error.errors[0].message;
        if (errorMsg.includes('current_password')) {
          setMessage({ type: 'error', text: 'Password saat ini tidak benar' });
        } else if (errorMsg.includes('password')) {
          setMessage({ type: 'error', text: 'Password tidak memenuhi persyaratan keamanan' });
        } else {
          setMessage({ type: 'error', text: errorMsg });
        }
      } else {
        setMessage({ type: 'error', text: 'Terjadi kesalahan saat memperbarui password' });
      }
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'text-red-600 bg-red-100';
    if (passwordStrength.score === 3) return 'text-yellow-600 bg-yellow-100';
    if (passwordStrength.score === 4) return 'text-blue-600 bg-blue-100';
    return 'text-green-600 bg-green-100';
  };

  const getStrengthText = () => {
    if (passwordStrength.score <= 2) return 'Lemah';
    if (passwordStrength.score === 3) return 'Sedang';
    if (passwordStrength.score === 4) return 'Kuat';
    return 'Sangat Kuat';
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Status Info */}
      <div className={`mb-6 p-4 rounded-lg border ${
        hasPassword 
          ? 'bg-blue-50 border-blue-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${hasPassword ? 'text-blue-500' : 'text-yellow-500'}`}>
            {hasPassword ? (
              <KeyIcon className="w-5 h-5" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5" />
            )}
          </div>
          <div>
            <h4 className={`text-sm font-medium ${
              hasPassword ? 'text-blue-800' : 'text-yellow-800'
            } mb-1`}>
              {hasPassword ? 'Ganti Password' : 'Buat Password'}
            </h4>
            <p className={`text-sm ${hasPassword ? 'text-blue-700' : 'text-yellow-700'}`}>
              {hasPassword 
                ? 'Anda sudah memiliki password. Masukkan password saat ini untuk menggantinya.'
                : 'Anda belum memiliki password. Buat password untuk mengamankan akun Anda.'
              }
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password (only if user has password) */}
        {hasPassword && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password Saat Ini *
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan password saat ini"
                required={hasPassword}
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
        )}

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password Baru *
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan password baru"
              required
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

          {/* Password Strength Indicator */}
          {formData.newPassword && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Kekuatan Password:</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getStrengthColor()}`}>
                  {getStrengthText()}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    passwordStrength.score <= 2 ? 'bg-red-500' :
                    passwordStrength.score === 3 ? 'bg-yellow-500' :
                    passwordStrength.score === 4 ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                ></div>
              </div>

              {/* Criteria Checklist */}
              <div className="space-y-1">
                {passwordStrength.feedback.map((criteria, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    {criteria.passed ? (
                      <CheckIcon className="w-3 h-3 text-green-500" />
                    ) : (
                      <XMarkIcon className="w-3 h-3 text-gray-400" />
                    )}
                    <span className={criteria.passed ? 'text-green-700' : 'text-gray-500'}>
                      {criteria.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Konfirmasi Password Baru *
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Konfirmasi password baru"
              required
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

          {/* Password Match Indicator */}
          {formData.confirmPassword && (
            <div className="mt-2">
              {formData.newPassword === formData.confirmPassword ? (
                <div className="flex items-center gap-2 text-xs text-green-700">
                  <CheckIcon className="w-3 h-3" />
                  <span>Password cocok</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-red-600">
                  <XMarkIcon className="w-3 h-3" />
                  <span>Password tidak cocok</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || passwordStrength.score < 3 || formData.newPassword !== formData.confirmPassword}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <KeyIcon className="w-4 h-4" />
              <span>{hasPassword ? 'Update Password' : 'Buat Password'}</span>
            </>
          )}
        </button>
      </form>

      {/* Security Tips */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">💡 Tips Keamanan</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Gunakan kombinasi huruf besar, kecil, angka, dan simbol</li>
          <li>• Hindari menggunakan informasi pribadi dalam password</li>
          <li>• Jangan gunakan password yang sama di aplikasi lain</li>
          <li>• Pertimbangkan menggunakan password manager</li>
        </ul>
      </div>
    </div>
  );
}
