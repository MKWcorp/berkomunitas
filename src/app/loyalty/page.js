"use client";
import { useState, useEffect } from "react";
import { useSSOUser } from "@/hooks/useSSOUser";
import { 
  CurrencyDollarIcon,
  ClockIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../components/GlassCard';

export default function LoyaltyPage() {
  const [loyaltyHistory, setLoyaltyHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isLoaded } = useSSOUser();

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/profil`, { credentials: 'include' });
        if (response.ok) {
          const result = await response.json();
          console.log('API Response:', result); // Debug log
          if (result.success && result.data && result.data.member) {
            console.log('Member data:', result.data.member); // Debug log
            setLoyaltyHistory(result.data.member.loyalty_point_history || []);
          } else {
            console.log('API response structure issue:', result);
          }
        } else {
           throw new Error("Gagal memuat data profil.");
        }
      } catch (error) {
        console.error('Error loading loyalty data:', error);
        setLoyaltyHistory([]);
      } finally {
        setLoading(false);
      }
    };
    if (isLoaded && user) {
      loadProfileData();
    } else if (isLoaded && !user) {
      setLoading(false);
    }
  }, [isLoaded, user]);

  if (loading) {
    return (
      <GlassCard className="min-h-screen" padding="lg">
        <div className="flex items-center justify-center min-h-screen">
          <GlassCard className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-gray-700">Memuat data loyalitas...</div>
          </GlassCard>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="min-h-screen" padding="lg">
      <div className="container mx-auto">
        {/* History Table */}
        <GlassCard>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <ChartBarIcon className="h-6 w-6 text-blue-500 mr-2" />
            Riwayat Loyalty
          </h2>
          <GlassCard variant="subtle" padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-white/20">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase">
                      <ClockIcon className="h-4 w-4 inline mr-1" />
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase">Event</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase">
                      <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                      Poin
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {loyaltyHistory.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8">
                        <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Belum ada riwayat poin.</p>
                      </td>
                    </tr>
                  ) : (
                    loyaltyHistory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/20 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleString('id-ID', { 
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })
                            : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">{item.event}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`font-medium ${item.point > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.point > 0 ? '+' : ''}{item.point}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </GlassCard>
      </div>
    </GlassCard>
  );
}
