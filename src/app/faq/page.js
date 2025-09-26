"use client";
import { useState } from "react";
import GlassCard from '../components/GlassCard';
import { 
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  StarIcon,
  SparklesIcon,
  UserIcon,
  CogIcon,
  ExclamationTriangleIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

// Daftar FAQ yang diperbarui dengan glass theme dan fitur terbaru
const FAQ_LIST = [
  {
    question: "Bagaimana cara mengakses admin panel?",
    answer: "Admin panel dapat diakses melalui subdomain khusus di admin.berkomunitas.com. Login menggunakan akun yang memiliki privilege admin. Panel menggunakan glass interface dengan navigasi lengkap untuk member management, task management, rewards, dan statistik.",
    category: "admin",
    count: 8
  },
  {
    question: "Mengapa admin.berkomunitas.com tidak bisa diakses?",
    answer: "Pastikan Anda memiliki akses admin yang valid. Subdomain admin menggunakan sistem routing khusus yang memerlukan verifikasi privilege. Jika masih bermasalah, coba clear DNS cache atau gunakan mode incognito. Hubungi administrator sistem jika masalah berlanjut.",
    category: "admin",
    count: 3
  },
  {
    question: "Apa perbedaan antara berkomunitas.com/admin-app dan admin.berkomunitas.com?",
    answer: "Keduanya menuju halaman yang sama, tetapi admin.berkomunitas.com adalah subdomain khusus untuk admin yang lebih professional dan mudah diingat. Subdomain menggunakan sistem routing otomatis yang mengarahkan ke panel admin tanpa perlu mengetik path panjang.",
    category: "admin",
    count: 5
  },
  {
    question: "Apa itu Glass Theme yang baru di Komunitas Komentar?",
    answer: "Glass Theme adalah tampilan modern dengan efek transparan dan blur yang elegan. Semua halaman kini menggunakan glass cards, Heroicons profesional, dan gradient backgrounds untuk pengalaman visual yang lebih menarik.",
    category: "ui",
    count: 28
  },
  {
    question: "Bagaimana cara menggunakan fitur pencarian tugas yang baru?",
    answer: "Pencarian tugas kini menggunakan sistem manual yang lebih efisien. Ketik kata kunci di kolom pencarian, lalu tekan Enter atau klik tombol 'Cari' (ikon kaca pembesar hijau). Hasil pencarian otomatis scroll ke atas untuk visibilitas yang lebih baik. Gunakan tombol 'Clear' untuk menghapus pencarian.",
    category: "tasks",
    count: 24
  },
  {
    question: "Bagaimana cara kerja filter 'Diverifikasi & Gagal' yang baru?",
    answer: "Filter 'Diverifikasi & Gagal' menampilkan tugas-tugas yang sudah diverifikasi admin dan dinyatakan gagal. Filter ini membantu Anda melihat tugas mana saja yang perlu diperbaiki atau tidak memenuhi kriteria. Gunakan filter ini untuk belajar dari kesalahan dan meningkatkan kualitas submission berikutnya.",
    category: "tasks",
    count: 22
  },
  {
    question: "Apa itu modal admin yang baru dan bagaimana cara kerjanya?",
    answer: "Modal admin kini muncul di bagian atas halaman (bukan tengah) untuk kompatibilitas yang lebih baik dengan endless scroll. Setiap modal dilengkapi dengan tombol 'Scroll to Top' untuk navigasi yang mudah, support ESC key untuk menutup, dan click-outside-to-close functionality.",
    category: "admin",
    count: 16
  },
  {
    question: "Bagaimana cara mendapatkan loyalty point?",
    answer: "Loyalty point didapat dari: Melengkapi profil (+5 poin), menyelesaikan task komentar (+2 poin), aktivitas komunitas lain seperti referral atau event. Semua transaksi tercatat dalam glass timeline di halaman profil.",
    category: "points",
    count: 26
  },
  {
    question: "Apa itu badge Silver/Gold/Platinum Member?",
    answer: "Badge adalah pencapaian berdasarkan total loyalty point yang ditampilkan dalam glass cards dengan gradient effect. Silver (100 poin), Gold (500 poin), Platinum (1000 poin). Badge muncul di profil dan leaderboard dengan desain yang lebih menarik.",
    category: "badges",
    count: 20
  },
  {
    question: "Bagaimana cara menggunakan fitur tukar poin?",
    answer: "Buka menu dengan ikon hadiah, pilih reward dalam glass card layout, klik 'Tukar Sekarang', konfirmasi dalam modal glass dialog. Status redemption akan ditampilkan dengan visual indicators yang jelas.",
    category: "rewards",
    count: 23
  },
  {
    question: "Mengapa profil saya harus lengkap untuk akses fitur?",
    answer: "Profil lengkap diperlukan untuk keamanan dan kualitas komunitas. Tanpa profil lengkap, Anda akan mendapat glass warning card dan hanya bisa akses halaman profil, sign-in/up, dan halaman publik.",
    category: "profile",
    count: 18
  },
  {
    question: "Bagaimana cara upload foto profil dengan sistem yang baru?",
    answer: "Gunakan interface upload yang baru dengan drag & drop atau file picker. Foto akan preview dalam glass card dengan border effect. Format yang didukung: JPG, PNG, WebP maksimal 5MB. Sistem auto-generate foto profil jika tidak diupload.",
    category: "profile",
    count: 15
  },
  {
    question: "Apa yang baru di admin interface?",
    answer: "Admin interface kini menggunakan glass theme dengan tab layout yang lebih terorganisir, AdminModal component untuk konsistensi, ScrollToTopButton untuk navigasi mudah, dan glass cards untuk semua panel management. Search admin juga diperbaiki dengan manual trigger.",
    category: "admin",
    count: 12
  },
  {
    question: "Bagaimana cara kerja leaderboard yang baru?",
    answer: "Leaderboard menggunakan glass table dengan gradient headers, TrophyIcon untuk top 3, dan foto profil dengan glass border. Ranking real-time berdasarkan loyalty points dengan link ke profil publik yang dilengkapi foto auto-generated.",
    category: "leaderboard",
    count: 17
  },
  {
    question: "Tidak Bisa Login atau Akses Halaman",
    answer: "Cek email sudah diverifikasi di Clerk. Pastikan profil lengkap (nama, WA, sosmed). Clear browser cache, disable ad blocker. Coba mode incognito. Reset password jika lupa. Hubungi admin jika masalah berlanjut.",
    category: "troubleshooting",
    count: 19
  },
  {
    question: "Glass theme tidak muncul atau loading lambat",
    answer: "Refresh dengan Ctrl+F5, pastikan browser mendukung backdrop-blur (Chrome 88+, Firefox 87+, Safari 14+). Disable hardware acceleration jika lag. Clear cache dan cookies. Periksa koneksi internet.",
    category: "troubleshooting",
    count: 14
  },
  {
    question: "Pencarian tugas tidak bekerja atau hasil tidak muncul",
    answer: "Pastikan menggunakan tombol 'Cari' atau menekan Enter setelah mengetik. Jangan menggunakan pencarian instant seperti sebelumnya. Scroll otomatis ke atas setelah pencarian. Gunakan tombol 'Clear' untuk reset. Refresh halaman jika masalah berlanjut.",
    category: "tasks",
    count: 16
  },
  {
    question: "Verifikasi task gagal atau poin tidak masuk",
    answer: "Pastikan keyword ada dalam komentar, submit sebelum deadline, link postingan valid. Cek riwayat poin di profil dengan glass timeline. Gunakan filter 'Diverifikasi & Gagal' untuk melihat alasan penolakan. Contact admin jika masalah berlanjut.",
    category: "tasks",
    count: 21
  },
  {
    question: "Modal admin tidak muncul di posisi yang tepat",
    answer: "Modal admin kini dirancang muncul di atas halaman untuk kompatibilitas endless scroll. Gunakan tombol ScrollToTop jika perlu navigasi. Tekan ESC untuk menutup modal. Klik di luar area modal juga bisa menutup.",
    category: "admin",
    count: 8
  },
  {
    question: "Bagaimana cara kerja username auto-generate?",
    answer: "Sistem otomatis membuat username dari nama lengkap: huruf kecil, ganti spasi dengan underscore, tambah angka random. Format: nama_lengkap_1234. Bisa diedit di halaman profil dengan validasi keunikan.",
    category: "profile",
    count: 11
  },
  {
    question: "Navigation menu tidak responsive di mobile",
    answer: "Menu otomatis jadi hamburger di mobile dengan glass effect. Clear cache, pastikan touch screen berfungsi normal, tidak ada screen protector yang mengganggu. Update browser mobile ke versi terbaru.",
    category: "mobile",
    count: 9
  },
  {
    question: "Tips keamanan dan best practices",
    answer: "Gunakan password unik & kuat. Jangan share akun. Logout setelah selesai. Update browser regularly. Laporkan aktivitas mencurigakan ke admin melalui notifikasi. Periksa status verifikasi task secara berkala.",
    category: "security",
    count: 13
  },
  {
    question: "Mengapa email saya tidak tersimpan saat registrasi?",
    answer: "Sistem baru menggunakan tabel email terpisah untuk keamanan. Jika email hilang saat registrasi, admin dapat memperbaiki melalui panel admin yang telah ditingkatkan. Email akan otomatis tersinkron dari Clerk authentication.",
    category: "profile", 
    count: 10
  }
];

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Get unique categories
  const categories = [
    { key: "all", label: "Semua", icon: QuestionMarkCircleIcon },
    { key: "ui", label: "Glass Theme & UI", icon: SparklesIcon },
    { key: "points", label: "Loyalty Points", icon: StarIcon },
    { key: "badges", label: "Badges & Rewards", icon: StarIcon },
    { key: "rewards", label: "Tukar Poin", icon: StarIcon },
    { key: "profile", label: "Profil", icon: UserIcon },
    { key: "tasks", label: "Tugas", icon: CogIcon },
    { key: "leaderboard", label: "Leaderboard", icon: StarIcon },
    { key: "admin", label: "Admin", icon: CogIcon },
    { key: "troubleshooting", label: "Troubleshooting", icon: ExclamationTriangleIcon },
    { key: "mobile", label: "Mobile", icon: CogIcon },
    { key: "security", label: "Keamanan", icon: ExclamationTriangleIcon }
  ];

  // Filter FAQ berdasarkan pencarian dan kategori
  const filteredFAQ = FAQ_LIST.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(search.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // FAQ paling sering ditanyakan (top 3 berdasarkan count)
  const topFAQ = [...FAQ_LIST].sort((a, b) => b.count - a.count).slice(0, 3);

  const getCategoryIcon = (category) => {
    const categoryData = categories.find(cat => cat.key === category);
    const IconComponent = categoryData?.icon || QuestionMarkCircleIcon;
    return <IconComponent className="h-5 w-5" />;
  };

  return (
    <GlassCard className="min-h-screen" padding="lg">
      <div className="container mx-auto">
        
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <QuestionMarkCircleIcon className="h-10 w-10 text-blue-500" />
            FAQ - Pertanyaan yang Sering Diajukan
          </h1>
        </div>

        {/* Search Bar */}
        <GlassCard variant="subtle" padding="default" className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-2xl backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
              placeholder="Cari pertanyaan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </GlassCard>

        {/* Category Filter */}
        <GlassCard variant="subtle" padding="default" className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-medium text-sm transition-all duration-300 ${
                    selectedCategory === category.key
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-white/30'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Top FAQ Section */}
        <GlassCard variant="default" padding="lg" className="mb-6" hover>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
            <LightBulbIcon className="h-6 w-6 text-amber-500" />
            Paling Sering Ditanyakan
          </h2>
          <div className="space-y-4">
            {topFAQ.map((faq, idx) => (
              <GlassCard key={idx} variant="subtle" padding="default" className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-blue-200/50">
                <div className="flex items-start gap-3">
                  {getCategoryIcon(faq.category)}
                  <div className="flex-1">
                    <div className="font-semibold text-blue-800 mb-2">{faq.question}</div>
                    <div className="text-gray-700 text-sm leading-relaxed">{faq.answer}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">Ditanya {faq.count}x</span>
                      <span className="px-2 py-1 bg-blue-100/50 text-blue-700 text-xs rounded-full">
                        {categories.find(cat => cat.key === faq.category)?.label}
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </GlassCard>

        {/* All FAQ Section */}
        <GlassCard variant="default" padding="lg" hover>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            {selectedCategory === "all" ? "Semua Pertanyaan" : `Kategori: ${categories.find(cat => cat.key === selectedCategory)?.label}`}
          </h2>
          
          {filteredFAQ.length === 0 ? (
            <GlassCard variant="subtle" padding="lg" className="text-center">
              <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Tidak ada pertanyaan yang cocok dengan pencarian Anda.</p>
              <p className="text-sm text-gray-400 mt-2">Coba gunakan kata kunci lain atau pilih kategori berbeda.</p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {filteredFAQ.map((faq, idx) => (
                <GlassCard key={idx} variant="subtle" padding="default" className="bg-white/10 hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-start gap-3">
                    {getCategoryIcon(faq.category)}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-2">{faq.question}</div>
                      <div className="text-gray-700 text-sm leading-relaxed">{faq.answer}</div>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-gray-500">Ditanya {faq.count}x</span>
                        <span className="px-2 py-1 bg-white/20 text-gray-600 text-xs rounded-full border border-white/30">
                          {categories.find(cat => cat.key === faq.category)?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Help Section */}
        <GlassCard variant="subtle" padding="lg" className="mt-6 bg-gradient-to-r from-green-50/50 to-blue-50/50 border-green-200/50">
          <div className="text-center">
            <QuestionMarkCircleIcon className="h-12 w-12 mx-auto text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">Tidak menemukan jawaban?</h3>
            <p className="text-green-700 mb-4">
              Hubungi admin melalui sistem notifikasi atau laporkan pertanyaan baru di GitHub Issues.
            </p>
            <div className="flex justify-center gap-4">
              <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25">
                Kontak Admin
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25">
                GitHub Issues
              </button>
            </div>
          </div>
        </GlassCard>

      </div>
    </GlassCard>
  );
}