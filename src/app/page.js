'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { isLoggedIn, getCurrentUser } from '@/lib/sso';

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

// Helper to generate initials for dummy logo
const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

// Helper for random gradient based on name
const getGradient = (name) => {
  const charCode = name.charCodeAt(0);
  const gradients = [
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
  ];
  return gradients[charCode % gradients.length];
};

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, comments: 0, tasks: 0 });

  useEffect(() => {
    // Check if user is logged in
    if (isLoggedIn()) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    }
    setLoading(false);

    // Fetch stats
    fetch('/api/landing-stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  const totalPartners = PARTNERS.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden">
      
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="font-bold text-xl">B</span>
               </div>
               <span className="text-xl font-bold tracking-tight">Berkomunitas</span>
            </div>
            
            <div className="hidden md:flex gap-8">
                {user ? (
                     <div className='flex items-center gap-4'>
                         <span className='text-sm text-slate-300'>Hai, {user.nama_lengkap}</span>
                         <Link href="/profil" className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors">
                            Dashboard
                        </Link>
                     </div>
                ) : (
                    <div className='flex items-center gap-4'>
                        <Link href="/auth/login" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">Masuk</Link>
                        <Link href="/auth/register" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-sm font-medium transition-colors shadow-lg shadow-blue-900/50">Daftar Sekarang</Link>
                    </div>
                )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-8 animate-fadeIn">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-sm font-medium">Platform Reputasi Digital Terpercaya</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight">
                Membangun <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Ekosistem Digital</span> <br/>
                Yang Berdampak Nyata
            </h1>
            
            <p className="max-w-2xl mx-auto text-xl text-slate-400 mb-12 leading-relaxed">
                Bergabunglah dengan ekosistem kami untuk meningkatkan reputasi brand, 
                memperluas jangkauan digital, dan berkolaborasi dengan ribuan anggota komunitas.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20">
                {!user && (
                    <Link href="/auth/register" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full text-lg font-bold shadow-xl shadow-blue-900/30 transition-all transform hover:-translate-y-1">
                        Gabung Komunitas
                    </Link>
                )}
                <Link href="#partners" className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full text-lg font-medium backdrop-blur-sm transition-all">
                    Lihat Portofolio
                </Link>
            </div>

            {/* Stats Section - Full Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto border-t border-white/10 pt-12">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors">
                    <div className="text-4xl font-bold text-white mb-2">{formatNumber(stats.users)}</div>
                    <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Anggota Komunitas</div>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors">
                    <div className="text-4xl font-bold text-yellow-400 mb-2">{formatNumber(stats.comments)}</div>
                    <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Total Interaksi</div>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors">
                    <div className="text-4xl font-bold text-emerald-400 mb-2">{formatNumber(stats.tasks)}</div>
                    <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Misi Selesai</div>
                </div>
                 <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors">
                    <div className="text-4xl font-bold text-purple-400 mb-2">{totalPartners}+</div>
                    <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Unit Bisnis</div>
                </div>
            </div>

        </div>
      </main>

      {/* Partners Section */}
      <section id="partners" className="relative z-10 py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Portofolio Unit Bisnis</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                    Dipercaya oleh berbagai unit bisnis dari berbagai industri untuk membangun reputasi digital yang kuat dan organik.
                </p>
            </div>

            <div className="space-y-16">
                {PARTNERS.map((category, idx) => (
                    <div key={idx} className="relative">
                        <h3 className="text-xl font-semibold text-blue-400 mb-8 pl-4 border-l-4 border-blue-500">
                            {category.category}
                        </h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {category.items.map((item, itemIdx) => (
                                <div key={itemIdx} className="group cursor-default">
                                    <div className="aspect-square rounded-2xl bg-white/5 border border-white/5 group-hover:border-white/20 flex flex-col items-center justify-center p-4 transition-all duration-300 hover:bg-white/10 hover:-translate-y-1">
                                        {/* Dummy Logo */}
                                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getGradient(item)} flex items-center justify-center text-white font-bold text-lg shadow-lg mb-4`}>
                                            {getInitials(item)}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors line-clamp-2">
                                                {item}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-white/10 bg-slate-950">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                        <span className="font-bold text-blue-500">B</span>
                    </div>
                    <span className="font-semibold text-lg text-slate-300">Berkomunitas</span>
                </div>
                <div className="text-slate-500 text-sm">
                    &copy; {new Date().getFullYear()} Berkomunitas. All rights reserved.
                </div>
           </div>
      </footer>

    </div>
  );
}