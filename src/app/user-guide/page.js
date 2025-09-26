'use client';

import { useState } from 'react';

export default function UserGuidePage() {
  const [openSection, setOpenSection] = useState('getting-started');

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? '' : section);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📖 Panduan Pengguna</h1>
          <p className="text-gray-600">
            Pelajari cara menggunakan platform Komunitas Komentar untuk mendapatkan penghasilan dan loyalty point!
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🚀 Navigasi Cepat</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <button
              onClick={() => toggleSection('getting-started')}
              className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span className="text-2xl mb-2">🎯</span>
              <span className="text-sm font-medium text-blue-800">Memulai</span>
            </button>
            <button
              onClick={() => toggleSection('tasks')}
              className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <span className="text-2xl mb-2">📝</span>
              <span className="text-sm font-medium text-green-800">Tugas</span>
            </button>
            <button
              onClick={() => toggleSection('rewards')}
              className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <span className="text-2xl mb-2">🎁</span>
              <span className="text-sm font-medium text-purple-800">Tukar Poin</span>
            </button>
            <button
              onClick={() => toggleSection('profile')}
              className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <span className="text-2xl mb-2">👤</span>
              <span className="text-sm font-medium text-orange-800">Profil</span>
            </button>
            <button
              onClick={() => toggleSection('admin')}
              className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <span className="text-2xl mb-2">⚙️</span>
              <span className="text-sm font-medium text-indigo-800">Admin</span>
            </button>
            <button
              onClick={() => toggleSection('troubleshooting')}
              className="flex flex-col items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <span className="text-2xl mb-2">🔧</span>
              <span className="text-sm font-medium text-red-800">Tips</span>
            </button>
          </div>
        </div>

        {/* Getting Started Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <button
            onClick={() => toggleSection('getting-started')}
            className="w-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                🎯 Memulai
              </h2>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  openSection === 'getting-started' ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {openSection === 'getting-started' && (
            <div className="px-6 pb-6 border-t border-gray-200">
              <div className="space-y-4 mt-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">1. Registrasi & Login</h3>
                  <ul className="text-blue-800 space-y-1 text-sm">
                    <li>• Klik "Gabung Komunitas" di homepage</li>
                    <li>• Pilih login dengan Email, Google, atau Facebook</li>
                    <li>• Verifikasi email jika diminta</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-2">2. Lengkapi Profil (WAJIB)</h3>
                  <ul className="text-yellow-800 space-y-1 text-sm">
                    <li>• Isi nama lengkap dan nomor WhatsApp</li>
                    <li>• Tambahkan minimal 1 link sosial media</li>
                    <li>• Tanpa profil lengkap, Anda tidak bisa akses fitur lain</li>
                    <li>• <strong>Bonus:</strong> +5 loyalty point untuk profil pertama!</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">3. Navigasi Platform</h3>
                  <ul className="text-green-800 space-y-1 text-sm">
                    <li>• Menu utama tersedia di navigation bar</li>
                    <li>• Loyalty point ditampilkan di pojok kanan atas</li>
                    <li>• Avatar profil untuk akses cepat ke profil, FAQ, dan User Guide</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tasks Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <button
            onClick={() => toggleSection('tasks')}
            className="w-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                📝 Mengerjakan Tugas
              </h2>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  openSection === 'tasks' ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {openSection === 'tasks' && (
            <div className="px-6 pb-6 border-t border-gray-200">
              <div className="space-y-4 mt-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">🔍 Cara Menggunakan Pencarian Tugas (BARU!):</h3>
                  <ol className="text-blue-800 space-y-1 text-sm list-decimal list-inside">
                    <li>Ketik kata kunci di kolom pencarian (tidak langsung mencari)</li>
                    <li>Tekan <strong>Enter</strong> atau klik tombol hijau <strong>"Cari"</strong></li>
                    <li>Hasil pencarian otomatis scroll ke atas untuk visibilitas lebih baik</li>
                    <li>Gunakan tombol abu-abu <strong>"Clear"</strong> untuk menghapus pencarian</li>
                    <li>Banner biru akan muncul menunjukkan pencarian yang sedang aktif</li>
                  </ol>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">� Fitur Filter Tugas:</h3>
                  <ul className="text-purple-800 space-y-1 text-sm">
                    <li>• <span className="font-medium">Semua:</span> Tampilkan semua tugas yang tersedia</li>
                    <li>• <span className="font-medium">Belum Selesai:</span> Hanya tugas yang bisa dikerjakan</li>
                    <li>• <span className="font-medium">Sudah Selesai:</span> Tugas yang sudah diselesaikan</li>
                    <li>• <span className="font-medium">Diverifikasi & Gagal:</span> Tugas yang gagal verifikasi (untuk belajar)</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Cara Mengerjakan Tugas:</h3>
                  <ol className="text-blue-800 space-y-1 text-sm list-decimal list-inside">
                    <li>Pilih tugas yang tersedia di halaman Tugas</li>
                    <li>Gunakan pencarian manual atau filter untuk menemukan tugas yang cocok</li>
                    <li>Klik "Ambil Tugas" untuk memulai</li>
                    <li>Ikuti link ke postingan sosial media</li>
                    <li>Buat komentar sesuai instruksi dengan keyword yang tepat</li>
                    <li>Kembali ke platform dan klik "Submit"</li>
                    <li>Tunggu verifikasi admin (maks 24 jam)</li>
                  </ol>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Status Tugas:</h3>
                  <ul className="text-green-800 space-y-1 text-sm">
                    <li>• <span className="font-medium text-green-600">Tersedia:</span> Siap dikerjakan</li>
                    <li>• <span className="font-medium text-yellow-600">Sedang Verifikasi:</span> Menunggu review admin</li>
                    <li>• <span className="font-medium text-blue-600">Selesai:</span> Berhasil dan poin diterima (+2 poin)</li>
                    <li>• <span className="font-medium text-red-600">Gagal:</span> Tidak memenuhi syarat (gunakan filter untuk belajar)</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-2">Tips Sukses:</h3>
                  <ul className="text-yellow-800 space-y-1 text-sm">
                    <li>• Baca instruksi tugas dengan teliti sebelum mulai</li>
                    <li>• Pastikan komentar relevan, berkualitas, dan mengandung keyword</li>
                    <li>• Gunakan akun sosial media yang aktif dan kredibel</li>
                    <li>• Submit tugas sebelum deadline yang ditetapkan</li>
                    <li>• Pelajari tugas yang gagal melalui filter "Diverifikasi & Gagal"</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rewards Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <button
            onClick={() => toggleSection('rewards')}
            className="w-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                🎁 Tukar Poin & Hadiah
              </h2>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  openSection === 'rewards' ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {openSection === 'rewards' && (
            <div className="px-6 pb-6 border-t border-gray-200">
              <div className="space-y-4 mt-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">Cara Menukar Poin:</h3>
                  <ol className="text-purple-800 space-y-1 text-sm list-decimal list-inside">
                    <li>Klik "🎁 Tukar Poin" di menu navigasi</li>
                    <li>Pilih hadiah yang sesuai budget poin Anda</li>
                    <li>Klik "Tukar Sekarang" pada hadiah yang diinginkan</li>
                    <li>Konfirmasi penukaran dan pastikan poin mencukupi</li>
                    <li>Tunggu verifikasi admin (1-3 hari kerja)</li>
                    <li>Terima notifikasi status redemption</li>
                  </ol>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Status Redemption:</h3>
                  <ul className="text-green-800 space-y-1 text-sm">
                    <li>• <span className="font-medium text-yellow-600">Menunggu Verifikasi:</span> Sedang ditinjau admin</li>
                    <li>• <span className="font-medium text-green-600">Disetujui:</span> Hadiah akan segera dikirim</li>
                    <li>• <span className="font-medium text-red-600">Ditolak:</span> Poin dikembalikan otomatis</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Jenis Hadiah:</h3>
                  <ul className="text-blue-800 space-y-1 text-sm">
                    <li>• Pulsa dan paket data</li>
                    <li>• E-wallet (OVO, Dana, GoPay)</li>
                    <li>• Voucher belanja online</li>
                    <li>• Merchandise eksklusif</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <button
            onClick={() => toggleSection('profile')}
            className="w-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                👤 Kelola Profil
              </h2>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  openSection === 'profile' ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {openSection === 'profile' && (
            <div className="px-6 pb-6 border-t border-gray-200">
              <div className="space-y-4 mt-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-900 mb-2">✨ Fitur Profil Terbaru:</h3>
                  <ul className="text-orange-800 space-y-1 text-sm">
                    <li>• <strong>Upload Foto Profil:</strong> Drag & drop atau file picker dengan preview glass card</li>
                    <li>• <strong>Auto-Generate Avatar:</strong> Sistem otomatis buat foto profil jika tidak diupload</li>
                    <li>• <strong>Username Publik:</strong> Buat URL profil yang unik dengan auto-generate</li>
                    <li>• <strong>Lencana & Achievements:</strong> Sistem badge dengan visual yang menarik</li>
                    <li>• <strong>Bio & Status:</strong> Personalisasi profil dengan glass card design</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">📱 Profile Wall & Interaksi:</h3>
                  <ul className="text-blue-800 space-y-1 text-sm">
                    <li>• Anggota lain bisa menulis di wall profil Anda</li>
                    <li>• Anda akan mendapat notifikasi saat ada pesan baru</li>
                    <li>• Wall profil terlihat di profil publik dengan glass theme</li>
                    <li>• Sistem moderasi otomatis untuk konten yang tidak pantas</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">🏆 Sistem Lencana & Loyalty:</h3>
                  <ul className="text-green-800 space-y-1 text-sm">
                    <li>• <strong>Silver Member:</strong> 100+ loyalty points dengan badge perak</li>
                    <li>• <strong>Gold Member:</strong> 500+ loyalty points dengan badge emas</li>
                    <li>• <strong>Platinum Member:</strong> 1000+ loyalty points dengan badge platinum</li>
                    <li>• Lencana ditampilkan di profil publik dengan gradient effect</li>
                    <li>• Progress tracking untuk mencapai level berikutnya</li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">🔒 Keamanan & Validasi Profil:</h3>
                  <ul className="text-purple-800 space-y-1 text-sm">
                    <li>• Profil lengkap wajib untuk akses semua fitur platform</li>
                    <li>• Validasi email melalui Clerk authentication</li>
                    <li>• Username unik dengan sistem auto-generate yang cerdas</li>
                    <li>• Sinkronisasi otomatis data dengan sistem keamanan berlapis</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Admin Features Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <button
            onClick={() => toggleSection('admin')}
            className="w-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                ⚙️ Fitur Admin (Untuk Admin)
              </h2>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  openSection === 'admin' ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {openSection === 'admin' && (
            <div className="px-6 pb-6 border-t border-gray-200">
              <div className="space-y-4 mt-4">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-indigo-900 mb-2">🔧 Interface Admin yang Diperbaharui:</h3>
                  <ul className="text-indigo-800 space-y-1 text-sm">
                    <li>• <strong>AdminModal:</strong> Modal muncul di atas untuk kompatibilitas endless scroll</li>
                    <li>• <strong>ScrollToTopButton:</strong> Navigasi mudah di halaman panjang</li>
                    <li>• <strong>Manual Search:</strong> Pencarian dengan tombol untuk performa lebih baik</li>
                    <li>• <strong>Glass Theme:</strong> Konsistensi visual di semua admin panel</li>
                    <li>• <strong>Tab Layout:</strong> Organisasi yang lebih baik untuk akses fitur</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-900 mb-2">📊 Fitur Verifikasi Task:</h3>
                  <ul className="text-red-800 space-y-1 text-sm">
                    <li>• Filter "Diverifikasi & Gagal" untuk review task yang ditolak</li>
                    <li>• Status tracking yang lebih detail untuk setiap submission</li>
                    <li>• Notifikasi otomatis ke user saat status berubah</li>
                    <li>• Sistem logging untuk audit trail</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Troubleshooting Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <button
            onClick={() => toggleSection('troubleshooting')}
            className="w-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                🔧 Troubleshooting & Tips
              </h2>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  openSection === 'troubleshooting' ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {openSection === 'troubleshooting' && (
            <div className="px-6 pb-6 border-t border-gray-200">
              <div className="space-y-4 mt-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-2">🔍 Masalah Pencarian Task:</h3>
                  <ul className="text-yellow-800 space-y-1 text-sm">
                    <li>• Pastikan menekan Enter atau klik tombol "Cari" setelah mengetik</li>
                    <li>• Gunakan tombol "Clear" untuk reset pencarian</li>
                    <li>• Refresh halaman jika pencarian tidak responsif</li>
                    <li>• Periksa koneksi internet jika loading lambat</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-900 mb-2">❌ Task Ditolak atau Gagal Verifikasi:</h3>
                  <ul className="text-red-800 space-y-1 text-sm">
                    <li>• Cek filter "Diverifikasi & Gagal" untuk melihat alasan penolakan</li>
                    <li>• Pastikan keyword sesuai dan muncul dalam komentar</li>
                    <li>• Verifikasi link postingan masih aktif dan dapat diakses</li>
                    <li>• Hubungi admin jika merasa ada kesalahan dalam penilaian</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">🌐 Masalah Browser & Performance:</h3>
                  <ul className="text-blue-800 space-y-1 text-sm">
                    <li>• Gunakan browser modern yang mendukung backdrop-blur</li>
                    <li>• Clear cache dan cookies secara berkala</li>
                    <li>• Disable hardware acceleration jika UI tampak lambat</li>
                    <li>• Update browser ke versi terbaru untuk kompatibilitas optimal</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">💡 Tips Performa Optimal:</h3>
                  <ul className="text-green-800 space-y-1 text-sm">
                    <li>• Gunakan pencarian manual daripada mengetik berulang kali</li>
                    <li>• Manfaatkan filter untuk mempersempit hasil dengan cepat</li>
                    <li>• Refresh halaman setelah menyelesaikan banyak task</li>
                    <li>• Logout dan login kembali jika mengalami masalah persisten</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">💬 Butuh Bantuan?</h2>
          <p className="mb-4">Tim support kami siap membantu Anda!</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/faq"
              className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors text-center"
            >
              📖 Lihat FAQ
            </a>
            <a
              href="mailto:support@komunitas-komentar.com"
              className="bg-transparent border-2 border-white text-white px-6 py-2 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors text-center"
            >
              ✉️ Email Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
