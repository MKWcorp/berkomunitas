'use client';
import { useState, useEffect } from 'react';
import { useSSOUser } from '@/hooks/useSSOUser';

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useSSOUser();

  const steps = [
    {
      title: "Selamat Datang di Komunitas Komentar!",
      content: "Platform untuk mendapatkan penghasilan dengan mengerjakan tugas komentar dari berbagai partner.",
      icon: "🎉"
    },
    {
      title: "Lengkapi Profil Anda (WAJIB)",
      content: "Sebelum dapat menggunakan platform, Anda HARUS melengkapi profil: nama lengkap, nomor WhatsApp, dan minimal 1 sosial media. Bonus: dapatkan +5 loyalty point!",
      icon: "👤"
    },
    {
      title: "Pilih dan Kerjakan Tugas",
      content: "Lihat daftar tugas yang tersedia, pilih yang sesuai, dan kerjakan sesuai instruksi.",
      icon: "📝"
    },
    {
      title: "Verifikasi Otomatis",
      content: "Setelah mengerjakan, sistem akan memverifikasi komentar Anda secara otomatis dalam 6 jam.",
      icon: "✅"
    },
    {
      title: "Dapatkan Penghasilan",
      content: "Tugas yang terverifikasi akan memberikan penghasilan yang bisa Anda kumpulkan.",
      icon: "💰"
    }
  ];

  useEffect(() => {
    // Cek apakah user baru (belum pernah onboarding)
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    if (!hasCompletedOnboarding && user) {
      setIsOpen(true);
    }
  }, [user]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Selesai onboarding
      localStorage.setItem('onboarding_completed', 'true');
      setIsOpen(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">{steps[currentStep].icon}</div>
          <h2 className="text-xl font-bold mb-4">{steps[currentStep].title}</h2>
          <p className="text-gray-600 mb-6">{steps[currentStep].content}</p>
          
          <div className="flex justify-center space-x-2 mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Lewati
            </button>
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {currentStep === steps.length - 1 ? 'Selesai' : 'Selanjutnya'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 