'use client';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import GlassCard from '../../components/GlassCard';

export function NotificationMessage({ message, onClose }) {
  if (!message) return null;

  const isSuccess = message.includes('berhasil');
  const isWarning = message.includes('peringatan') || message.includes('warning');

  return (
    <GlassCard 
      variant="default" 
      padding="default" 
      className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 transition-all duration-500 shadow-xl ${
        isSuccess
          ? 'bg-green-50/90 border-green-400/50' 
          : isWarning
          ? 'bg-yellow-50/90 border-yellow-400/50'
          : 'bg-red-50/90 border-red-400/50'
      }`}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {isSuccess ? (
            <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          ) : isWarning ? (
            <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
          ) : (
            <XCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
          )}
        </div>
        <div className="ml-2 sm:ml-3 flex-1">
          <p className={`text-xs sm:text-sm font-medium ${
            isSuccess 
              ? 'text-green-800' 
              : isWarning 
              ? 'text-yellow-800'
              : 'text-red-800'
          }`}>
            {message}
          </p>
        </div>
        <div className="ml-2 sm:ml-auto sm:pl-3">
          <button
            onClick={onClose}
            className={`inline-flex ${
              isSuccess 
                ? 'text-green-700 hover:text-green-600' 
                : isWarning
                ? 'text-yellow-700 hover:text-yellow-600'
                : 'text-red-700 hover:text-red-600'
            }`}
          >
            <span className="sr-only">Close</span>
            <XCircleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

export function ProfileIncompleteWarning({ isRequired, isProfileIncomplete }) {
  if (!isRequired && !isProfileIncomplete) return null;

  return (
    <GlassCard variant="subtle" padding="default" className="mb-6 bg-red-100/50 border-red-400/30 border-l-4 border-l-red-500">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Profil Belum Lengkap
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>
              Lengkapi profil Anda untuk mendapatkan akses penuh ke fitur-fitur komunitas:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Nama lengkap</li>
              <li>Nomor WhatsApp</li>
              <li>Minimal satu profil media sosial</li>
            </ul>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
