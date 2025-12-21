'use client';
import { useState } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';
import { 
  LinkIcon, 
  TrashIcon,
  PlusIcon,
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGoogle, 
  faFacebook
} from '@fortawesome/free-brands-svg-icons';

const getProviderIcon = (provider) => {
  const iconProps = { className: "w-5 h-5" };
  
  switch (provider) {
    case 'google':
      return <FontAwesomeIcon icon={faGoogle} {...iconProps} />;
    case 'facebook':
      return <FontAwesomeIcon icon={faFacebook} {...iconProps} />;
    default:
      return <LinkIcon className="w-5 h-5" />;
  }
};

const getProviderName = (provider) => {
  const names = {
    google: 'Google',
    facebook: 'Facebook'
  };
  return names[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
};

const getProviderColor = (provider) => {
  const colors = {
    google: 'text-red-500',
    facebook: 'text-blue-600'
  };
  return colors[provider] || 'text-gray-500';
};

export default function ExternalAccountsManager() {
  const { user } = useSSOUser();
  const [loading, setLoading] = useState({});
  const [message, setMessage] = useState('');

  const availableProviders = ['google', 'facebook'];

  // Helper function to render message with appropriate icon
  const renderMessage = (message) => {
    if (!message) return null;
    
    let iconComponent;
    let bgColor, textColor, borderColor;
    
    if (message.includes('berhasil') || message.includes('Koneksi dengan')) {
      iconComponent = <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      bgColor = 'bg-green-50';
      textColor = 'text-green-800';
      borderColor = 'border-green-200';
    } else if (message.includes('Gagal') || message.includes('Error')) {
      iconComponent = <XCircleIcon className="w-5 h-5 text-red-600" />;
      bgColor = 'bg-red-50';
      textColor = 'text-red-800';
      borderColor = 'border-red-200';
    } else {
      iconComponent = <LockClosedIcon className="w-5 h-5 text-blue-600" />;
      bgColor = 'bg-blue-50';
      textColor = 'text-blue-800';
      borderColor = 'border-blue-200';
    }
    
    return (
      <div className={`mb-4 p-4 ${bgColor} ${borderColor} ${textColor} border rounded-xl backdrop-blur-sm`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {iconComponent}
          </div>
          <div className="flex-1">
            <pre className="whitespace-pre-wrap text-sm font-medium">{message}</pre>
          </div>
        </div>
      </div>
    );
  };

  // Alternative method for development environment
  const handleConnectProviderWithRedirect = async (provider) => {
    if (!user) return;

    setLoading(prev => ({ ...prev, [provider]: 'connecting' }));
    setMessage('');

    try {
      const oauthStrategy = `oauth_${provider}`;
      
      // Try with redirect URL for development
      await user.createExternalAccount({
        strategy: oauthStrategy,
        redirectUrl: `${window.location.origin}/profil`,
      });
      
      setMessage(`✅ ${getProviderName(provider)} berhasil terhubung!`);
    } catch (error) {
      console.error(`Error connecting ${provider} with redirect:`, error);
      setMessage(`❌ Gagal menghubungkan ${getProviderName(provider)}: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, [provider]: null }));
    }
  };

  const handleConnectProvider = async (provider) => {
    if (!user) return;

    setLoading(prev => ({ ...prev, [provider]: 'connecting' }));
    setMessage('');

    try {
      // Using Clerk's OAuth connection method
      const oauthStrategy = `oauth_${provider}`;
      
      await user.createExternalAccount({
        strategy: oauthStrategy,
      });
      
      setMessage(`✅ ${getProviderName(provider)} berhasil terhubung!`);
    } catch (error) {
      console.error(`Error connecting ${provider}:`, error);
      
      // Handle additional verification error specifically
      if (error.message?.includes('additional verification') || 
          error.message?.includes('perform this operation') ||
          error.errors?.[0]?.code === 'additional_verification_required' ||
          error.errors?.[0]?.code === 'external_account_exists') {
        
        // For development environment, redirect to Clerk's built-in UI
        setMessage(`Jika gagal menghubungkan ${getProviderName(provider)}, silakan:
        
1. Klik foto profil Anda di kanan atas
2. Pilih "Pengaturan" 
3. Pilih "Connected accounts"
4. Klik "Connect" pada ${getProviderName(provider)}
5. Selesaikan proses login di popup

Setelah selesai, kembali ke tab Pengaturan dan refresh halaman untuk melihat akun yang terhubung.`);
        
      } else {
        setMessage(`Gagal menghubungkan ${getProviderName(provider)}: ${error.errors?.[0]?.message || error.message}`);
      }
    } finally {
      setLoading(prev => ({ ...prev, [provider]: null }));
    }
  };

  const handleDisconnectProvider = async (externalAccountId, provider) => {
    if (!user) return;

    // Confirm before disconnecting
    if (!confirm(`Apakah Anda yakin ingin memutus koneksi dengan ${getProviderName(provider)}?`)) {
      return;
    }

    setLoading(prev => ({ ...prev, [provider]: 'disconnecting' }));
    setMessage('');

    try {
      // Find and destroy the external account
      const externalAccount = user.externalAccounts.find(acc => acc.id === externalAccountId);
      if (externalAccount) {
        await externalAccount.destroy();
        setMessage(`Koneksi dengan ${getProviderName(provider)} berhasil diputus!`);
      }
    } catch (error) {
      console.error('Error disconnecting account:', error);
      
      // Enhanced error handling for development environment
      if (error.message?.includes('additional verification') || 
          error.message?.includes('perform this operation') ||
          error.errors?.[0]?.code === 'additional_verification_required') {
        
        setMessage(`Untuk memutus koneksi ${getProviderName(provider)} di development environment, silakan:

1. Klik foto profil Anda di kanan atas
2. Pilih "Manage account" 
3. Pilih "Connected accounts"
4. Klik "Disconnect" pada ${getProviderName(provider)}

Setelah selesai, refresh halaman ini untuk melihat perubahan.`);
        
      } else {
        setMessage(`Gagal memutus koneksi: ${error.errors?.[0]?.message || error.message}`);
      }
    } finally {
      setLoading(prev => ({ ...prev, [provider]: null }));
    }
  };

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

  const connectedAccounts = user.externalAccounts || [];
  const connectedProviders = connectedAccounts.map(acc => acc.provider);

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-xl">
          <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Akun Terhubung</h3>
          <p className="text-xs sm:text-sm text-gray-600">
            Kelola koneksi dengan platform media sosial
          </p>
        </div>
      </div>

      {/* Message Display */}
      {renderMessage(message)}

      {/* Connected Accounts List */}
      <div className="space-y-3 mb-6">
        {connectedAccounts.length > 0 ? (
          connectedAccounts.map((account) => (
            <div 
              key={account.id} 
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`flex-shrink-0 ${getProviderColor(account.provider)}`}>
                  {getProviderIcon(account.provider)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-gray-800 block">
                    {getProviderName(account.provider)}
                  </span>
                  <div className="text-gray-600 text-sm space-y-0.5">
                    {account.emailAddress && (
                      <div className="truncate">• {account.emailAddress}</div>
                    )}
                    {account.username && (
                      <div className="truncate">• @{account.username}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleDisconnectProvider(account.id, account.provider)}
                disabled={loading[account.provider] === 'disconnecting'}
                className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1 px-2 py-1 sm:px-0 sm:py-0 bg-white sm:bg-transparent rounded sm:rounded-none border sm:border-none border-red-200 sm:border-transparent"
              >
                {loading[account.provider] === 'disconnecting' ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-red-600"></div>
                    <span>Disconnecting...</span>
                  </>
                ) : (
                  <>
                    <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Disconnect</span>
                  </>
                )}
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <LinkIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>Belum ada akun yang terhubung</p>
            <p className="text-sm">Hubungkan akun media sosial untuk kemudahan akses</p>
          </div>
        )}
      </div>

      {/* Available Providers to Connect */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Hubungkan Akun Baru:</h4>
        
        {/* Instructions for OAuth Connection */}
        <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-3 sm:p-4 mb-4 shadow-sm">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="text-blue-500 mt-0.5 flex-shrink-0">
              <LockClosedIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h5 className="text-xs sm:text-sm font-medium text-blue-800 mb-2">Cara Menghubungkan Akun:</h5>
              <div className="text-xs sm:text-sm text-blue-700 space-y-2">
                <div>
                  <strong>Langkah-langkah:</strong>
                  <ol className="list-decimal list-inside ml-1 sm:ml-2 space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                    <li>Klik foto profil Anda di kanan atas</li>
                    <li>Pilih <strong>"Pengaturan"</strong></li>
                    <li>Pilih <strong>"Connected accounts"</strong></li>
                    <li>Klik <strong>"Connect"</strong> pada Facebook</li>
                    <li>Selesaikan proses login Facebook di popup</li>
                    <li>Kembali ke halaman Pengaturan dan refresh untuk melihat hasil</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-2 sm:gap-3">
          {availableProviders
            .filter(provider => !connectedProviders.includes(provider))
            .map((provider) => (
              <button
                key={provider}
                onClick={() => handleConnectProvider(provider)}
                disabled={loading[provider] === 'connecting'}
                className="flex items-center justify-between p-3 bg-gray-50/80 backdrop-blur-sm hover:bg-gray-100/80 border border-gray-200/50 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 ${getProviderColor(provider)}`}>
                    {getProviderIcon(provider)}
                  </div>
                  <span className="font-medium text-gray-700 text-sm sm:text-base">
                    {getProviderName(provider)}
                  </span>
                </div>
                
                {loading[provider] === 'connecting' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                ) : (
                  <PlusIcon className="w-4 h-4 text-gray-400" />
                )}
              </button>
            ))}
        </div>

        {availableProviders.filter(provider => !connectedProviders.includes(provider)).length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
              Semua provider yang tersedia sudah terhubung!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
