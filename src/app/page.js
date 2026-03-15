'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { isLoggedIn, getCurrentUser } from '@/lib/sso';
import { Sparkles, Hotel, Tv2, BookOpen, Building2, Trophy, BarChart2, Handshake, ChevronRight, Circle } from 'lucide-react';

// Helper for number formatting (Full numbers, no K/M)
const formatNumber = (num) => {
  return new Intl.NumberFormat('id-ID').format(num || 0);
};

// Partner Data Grouped by Category
const PARTNERS = [
  {
    category: "Beauty & Wellness",
    items: ["DRW Skincare", "DRW Prime", "DRW Herbs", "Klinik DrW Estetika", "Beauty Center", "DrW for Men"]
  },
  {
    category: "Hospitality & Travel",
    items: ["Dzawani Villa", "Dzawani Tour", "Dzawani Umroh", "Dzawani Kost", "Dzawani Bali"]
  },
  {
    category: "Media & Entertainment",
    items: ["Rame Ramai", "Dokidoki Rabu", "Baba Tiri", "Drw Matsuri"]
  },
  {
    category: "Social & Education",
    items: ["DRW Foundation", "DRW Academy", "Rumah Talenta Qurani", "Ambulance Umat"]
  },
  {
    category: "Corporate",
    items: ["DRW Corp", "DRW Corpora"]
  }
];

const getInitials = (name) => {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
};

const getAccentColor = (name) => {
  const colors = [
    { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
    { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
    { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  ];
  return colors[name.charCodeAt(0) % colors.length];
};

const CATEGORY_ICONS = {
  "Beauty & Wellness": Sparkles,
  "Hospitality & Travel": Hotel,
  "Media & Entertainment": Tv2,
  "Social & Education": BookOpen,
  "Corporate": Building2,
};

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, comments: 0, tasks: 0 });

  useEffect(() => {
    if (isLoggedIn()) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    }
    setLoading(false);

    fetch('/api/landing-stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  const totalPartners = PARTNERS.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-gray-50 to-white pt-16 pb-24 lg:pt-24 lg:pb-32 border-b border-gray-100">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 mb-8 text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Platform Reputasi Digital Terpercaya
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-gray-900">
            Membangun{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
              Ekosistem Digital
            </span>
            <br />
            Yang Berdampak Nyata
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-gray-500 mb-10 leading-relaxed">
            Bergabunglah dengan ekosistem kami untuk meningkatkan reputasi brand,
            memperluas jangkauan digital, dan berkolaborasi dengan ribuan anggota komunitas.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-20">
            {user ? (
              <Link href="/profil" className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-base font-semibold shadow-sm transition-all">
                Buka Dashboard <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-base font-semibold shadow-sm transition-all">
                  Mulai Gratis <ChevronRight className="w-4 h-4" />
                </Link>
                <Link href="#partners" className="px-8 py-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-base font-semibold transition-all shadow-sm">
                  Lihat Portofolio
                </Link>
              </>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { value: formatNumber(stats.users), label: 'Anggota Komunitas', color: 'text-blue-600' },
              { value: formatNumber(stats.comments), label: 'Total Interaksi', color: 'text-violet-600' },
              { value: formatNumber(stats.tasks), label: 'Misi Selesai', color: 'text-emerald-600' },
              { value: `${totalPartners}+`, label: 'Unit Bisnis', color: 'text-rose-600' },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Kenapa Berkomunitas?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Platform lengkap untuk mengelola reputasi digital dan komunitas brand Anda.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Trophy, title: 'Sistem Poin & Reward', desc: 'Anggota mendapat poin dari setiap aktivitas. Tukarkan poin dengan reward eksklusif.' },
              { icon: BarChart2, title: 'Dashboard Analytics', desc: 'Pantau performa reputasi brand Anda secara real-time dengan laporan lengkap.' },
              { icon: Handshake, title: 'Ekosistem Terpadu', desc: 'Terhubung dengan puluhan unit bisnis dalam satu platform komunitas yang terintegrasi.' },
            ].map((f, i) => (
              <div key={i} className="bg-gray-50 hover:bg-gray-100 rounded-2xl p-8 border border-gray-100 transition-colors">
                <div className="mb-4 p-3 inline-flex rounded-xl bg-blue-50"><f.icon className="w-7 h-7 text-blue-600" /></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section id="partners" className="py-24 bg-gray-50 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Portofolio Unit Bisnis</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Dipercaya oleh berbagai unit bisnis dari berbagai industri untuk membangun reputasi digital yang kuat dan organik.
            </p>
          </div>

          <div className="space-y-12">
            {PARTNERS.map((category, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-2 mb-6">
                  {(() => { const Icon = CATEGORY_ICONS[category.category] || Circle; return <Icon className="w-5 h-5 text-blue-500 flex-shrink-0" />; })()}
                  <h3 className="text-lg font-bold text-gray-700">{category.category}</h3>
                  <div className="flex-1 h-px bg-gray-200 ml-2" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {category.items.map((item, itemIdx) => {
                    const accent = getAccentColor(item);
                    return (
                      <div key={itemIdx} className="group">
                        <div className={`rounded-2xl bg-white border border-gray-100 group-hover:border-gray-200 group-hover:shadow-md flex flex-col items-center justify-center p-5 transition-all duration-200 hover:-translate-y-0.5`}>
                          <div className={`w-12 h-12 rounded-xl ${accent.bg} ${accent.border} border flex items-center justify-center ${accent.text} font-bold text-sm mb-3 shadow-sm`}>
                            {getInitials(item)}
                          </div>
                          <p className="text-center text-xs font-semibold text-gray-700 leading-tight line-clamp-2">{item}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-24 bg-white">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-3xl p-12 shadow-xl">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Siap Bergabung?</h2>
              <p className="text-blue-100 mb-8 text-lg">Daftarkan diri Anda sekarang dan mulai perjalanan digital bersama komunitas kami.</p>
              <Link href="/login" className="inline-flex items-center gap-2 px-10 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-lg">
                Daftar Gratis Sekarang <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-sm">B</span>
            </div>
            <span className="font-bold text-gray-800">Berkomunitas</span>
          </div>
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Berkomunitas. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/privacy-policy" className="hover:text-gray-700 transition-colors">Privacy</Link>
            <Link href="/faq" className="hover:text-gray-700 transition-colors">FAQ</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
