'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { EnvelopeIcon, LinkIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function EmailSocialManager() {
  const { user } = useUser();
  const [emailForm, setEmailForm] = useState({ email: '', isAddingEmail: false });
  const [socialForm, setSocialForm] = useState({ isConnecting: false });
  const [loading, setLoading] = useState({ email: false, social: false });
  const [messages, setMessages] = useState({ email: '', social: '' });

  // Add new email address
  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (!user || !emailForm.email.trim()) return;

    setLoading(prev => ({ ...prev, email: true }));
    setMessages(prev => ({ ...prev, email: '' }));

    try {
      // Use Clerk's user.createEmailAddress() method
      await user.createEmailAddress({ email: emailForm.email.trim() });
      
      setMessages(prev => ({ 
        ...prev, 
        email: '✅ Email berhasil ditambahkan! Silakan cek email untuk verifikasi.' 
      }));
      setEmailForm({ email: '', isAddingEmail: false });
      
      // Clear success message after 5 seconds
      setTimeout(() => setMessages(prev => ({ ...prev, email: '' })), 5000);
    } catch (error) {
      console.error('Error adding email:', error);
      setMessages(prev => ({ 
        ...prev, 
        email: `❌ ${error.errors?.[0]?.longMessage || 'Gagal menambahkan email. Silakan coba lagi.'}` 
      }));
    } finally {
      setLoading(prev => ({ ...prev, email: false }));
    }
  };

  // Connect to Facebook (using Clerk's OAuth)
  const handleConnectFacebook = async () => {
    setLoading(prev => ({ ...prev, social: true }));
    setMessages(prev => ({ ...prev, social: '' }));

    try {
      // Use Clerk's user.createExternalAccount() method for Facebook
      // Using minimal scope: public_profile (always required) + email (basic)
      await user.createExternalAccount({
        strategy: 'oauth_facebook',
        redirectUrl: window.location.href, // Stay on current page after connection
        additionalScopes: ['email'] // Only request email, public_profile is automatic
      });
      
      setMessages(prev => ({ 
        ...prev, 
        social: '✅ Facebook berhasil terhubung!' 
      }));
      
      // Clear success message after 5 seconds
      setTimeout(() => setMessages(prev => ({ ...prev, social: '' })), 5000);
    } catch (error) {
      console.error('Error connecting Facebook:', error);
      setMessages(prev => ({ 
        ...prev, 
        social: `❌ ${error.errors?.[0]?.longMessage || 'Gagal menghubungkan Facebook. Silakan coba lagi.'}` 
      }));
    } finally {
      setLoading(prev => ({ ...prev, social: false }));
    }
  };

  // Remove email address
  const handleRemoveEmail = async (emailId) => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, email: true }));
    
    try {
      const emailAddress = user.emailAddresses.find(email => email.id === emailId);
      if (emailAddress) {
        await emailAddress.destroy();
        setMessages(prev => ({ 
          ...prev, 
          email: '✅ Email berhasil dihapus!' 
        }));
        setTimeout(() => setMessages(prev => ({ ...prev, email: '' })), 3000);
      }
    } catch (error) {
      console.error('Error removing email:', error);
      setMessages(prev => ({ 
        ...prev, 
        email: '❌ Gagal menghapus email. Silakan coba lagi.' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, email: false }));
    }
  };

  // Remove external account
  const handleRemoveExternalAccount = async (accountId) => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, social: true }));
    
    try {
      const externalAccount = user.externalAccounts.find(account => account.id === accountId);
      if (externalAccount) {
        await externalAccount.destroy();
        setMessages(prev => ({ 
          ...prev, 
          social: '✅ Koneksi berhasil dihapus!' 
        }));
        setTimeout(() => setMessages(prev => ({ ...prev, social: '' })), 3000);
      }
    } catch (error) {
      console.error('Error removing external account:', error);
      setMessages(prev => ({ 
        ...prev, 
        social: '❌ Gagal menghapus koneksi. Silakan coba lagi.' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, social: false }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Email Management Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <EnvelopeIcon className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Email Addresses</h3>
          </div>
          {!emailForm.isAddingEmail && (
            <button
              onClick={() => setEmailForm(prev => ({ ...prev, isAddingEmail: true }))}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              Tambah Email
            </button>
          )}
        </div>

        {/* Current Email Addresses */}
        <div className="space-y-2 mb-4">
          {user?.emailAddresses?.map((email) => (
            <div key={email.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-gray-800">{email.emailAddress}</span>
                {email.verification?.status === 'verified' ? (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Verified
                  </span>
                ) : (
                  <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Pending
                  </span>
                )}
              </div>
              {!email.verification?.status === 'verified' && (
                <button
                  onClick={() => handleRemoveEmail(email.id)}
                  disabled={loading.email}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded disabled:bg-red-400"
                >
                  Hapus
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Email Form */}
        {emailForm.isAddingEmail && (
          <form onSubmit={handleAddEmail} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={emailForm.email}
                onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 bg-white/70 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="contoh@email.com"
                required
                disabled={loading.email}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading.email || !emailForm.email.trim()}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
              >
                {loading.email ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <CheckIcon className="w-4 h-4 mr-2" />
                )}
                {loading.email ? 'Menambahkan...' : 'Tambah Email'}
              </button>
              <button
                type="button"
                onClick={() => setEmailForm({ email: '', isAddingEmail: false })}
                disabled={loading.email}
                className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                <XMarkIcon className="w-4 h-4 mr-2" />
                Batal
              </button>
            </div>
          </form>
        )}

        {/* Email Messages */}
        {messages.email && (
          <div className={`mt-4 p-3 rounded-lg ${
            messages.email.includes('✅') 
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {messages.email}
          </div>
        )}
      </div>

      {/* Social Connections Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <LinkIcon className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Social Connections</h3>
          </div>
        </div>

        {/* Current External Accounts */}
        <div className="space-y-2 mb-4">
          {user?.externalAccounts?.map((account) => (
            <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-bold">
                    {account.provider === 'facebook' ? 'F' : account.provider.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-800 capitalize">{account.provider}</span>
                  <div className="text-sm text-gray-600">{account.emailAddress || account.username}</div>
                </div>
              </div>
              <button
                onClick={() => handleRemoveExternalAccount(account.id)}
                disabled={loading.social}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded disabled:bg-red-400"
              >
                Hapus
              </button>
            </div>
          ))}
          
          {(!user?.externalAccounts || user.externalAccounts.length === 0) && (
            <p className="text-gray-500 text-center py-4">Belum ada koneksi social media</p>
          )}
        </div>

        {/* Connect Facebook Button */}
        <button
          onClick={handleConnectFacebook}
          disabled={loading.social || user?.externalAccounts?.some(account => account.provider === 'facebook')}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
        >
          {loading.social ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Menghubungkan...
            </>
          ) : user?.externalAccounts?.some(account => account.provider === 'facebook') ? (
            'Facebook Sudah Terhubung'
          ) : (
            <>
              <LinkIcon className="w-4 h-4 mr-2" />
              Hubungkan Facebook
            </>
          )}
        </button>

        {/* Social Messages */}
        {messages.social && (
          <div className={`mt-4 p-3 rounded-lg ${
            messages.social.includes('✅') 
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {messages.social}
          </div>
        )}
      </div>
    </div>
  );
}
