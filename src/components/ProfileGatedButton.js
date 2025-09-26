import { useState } from 'react';
import { LockClosedIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function ProfileGatedButton({ 
  isProfileComplete, 
  children, 
  onClick, 
  className = '',
  disabled = false,
  tooltip = 'Lengkapi profil sosial media dulu',
  ...props 
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const router = useRouter();

  const handleClick = (e) => {
    if (!isProfileComplete) {
      e.preventDefault();
      e.stopPropagation();
      
      // Show quick action modal or redirect to profile
      const shouldRedirect = window.confirm(
        'Profil sosial media Anda belum lengkap.\n\nLengkapi sekarang untuk dapat mengerjakan tugas?'
      );
      
      if (shouldRedirect) {
        router.push('/profil?tab=sosial&complete=true');
      }
      
      return;
    }

    if (onClick) {
      onClick(e);
    }
  };

  const isDisabled = disabled || !isProfileComplete;

  return (
    <div className="relative inline-block">
      <button
        {...props}
        onClick={handleClick}
        disabled={isDisabled}
        className={`
          ${className}
          ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
          transition-all duration-200
        `}
        onMouseEnter={() => !isProfileComplete && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title={!isProfileComplete ? tooltip : props.title}
      >
        <div className="flex items-center gap-2">
          {!isProfileComplete && (
            <LockClosedIcon className="w-4 h-4 text-gray-400" />
          )}
          {children}
        </div>
      </button>

      {/* Tooltip */}
      {showTooltip && !isProfileComplete && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2">
          <div className="bg-gray-800 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
            <div className="flex items-center gap-2">
              <LockClosedIcon className="w-3 h-3" />
              <span>{tooltip}</span>
            </div>
            <div className="flex items-center justify-center mt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/profil?tab=sosial&complete=true');
                }}
                className="text-blue-300 hover:text-blue-200 underline text-xs flex items-center gap-1"
              >
                <UserPlusIcon className="w-3 h-3" />
                Lengkapi sekarang
              </button>
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
          </div>
        </div>
      )}
    </div>
  );
}
