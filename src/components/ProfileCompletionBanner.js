import { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import GlassCard from '../app/components/GlassCard';
import { useRouter } from 'next/navigation';

export default function ProfileCompletionBanner({ 
  isComplete, 
  message, 
  socialMediaCount = 0,
  className = '',
  onComplete = () => {},
  showDismiss = true
}) {
  const [isDismissed, setIsDismissed] = useState(false);
  const router = useRouter();

  // Check if previously dismissed and not expired - MUST be before any early returns
  useEffect(() => {
    const dismissed = localStorage.getItem('profileBannerDismissed');
    if (dismissed) {
      try {
        const data = JSON.parse(dismissed);
        if (Date.now() < data.expires) {
          setIsDismissed(true);
        } else {
          localStorage.removeItem('profileBannerDismissed');
        }
      } catch (e) {
        localStorage.removeItem('profileBannerDismissed');
      }
    }
  }, []);

  if (isComplete || isDismissed) {
    return null;
  }

  const handleCompleteProfile = () => {
    router.push('/profil?tab=sosial&complete=true');
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Store dismissal in localStorage with expiry
    const dismissalData = {
      timestamp: Date.now(),
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    localStorage.setItem('profileBannerDismissed', JSON.stringify(dismissalData));
  };

  return (
    <GlassCard 
      variant="subtle" 
      className={`border-l-4 border-orange-400 bg-orange-50 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-sm font-semibold text-orange-800">
                Profil Belum Lengkap
              </h3>
              <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full">
                {socialMediaCount} sosmed terdaftar
              </span>
            </div>
            
            <p className="text-sm text-orange-700 mb-3">
              {message || 'Lengkapi data profil sosial media untuk dapat mengerjakan tugas dan menukar poin'}
            </p>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCompleteProfile}
                className="inline-flex items-center px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
              >
                <UserPlusIcon className="w-4 h-4 mr-1.5" />
                Lengkapi Profil
              </button>
              
              <button
                onClick={() => router.push('/bantuan#profil-sosmed')}
                className="px-3 py-1.5 text-sm text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-100 transition-colors"
              >
                Butuh Bantuan?
              </button>
            </div>
          </div>
        </div>
        
        {showDismiss && (
          <button
            onClick={handleDismiss}
            className="p-1 text-orange-400 hover:text-orange-600 transition-colors"
            title="Tutup untuk 24 jam"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </GlassCard>
  );
}
