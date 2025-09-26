'use client';

import Link from 'next/link';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-2xl w-full bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl shadow-lg p-10 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">🚧 Sedang dalam Pemeliharaan</h1>
        <p className="text-gray-700 mb-6">
          Maaf atas ketidaknyamanan. Kami sedang melakukan pemeliharaan singkat untuk meningkatkan pengalaman Anda. Silakan kembali dalam beberapa saat.
        </p>

        <div className="space-y-4">
          <p className="text-sm text-gray-500">Perkiraan selesai: dalam beberapa menit — jika mengalami gangguan lebih lama, hubungi admin.</p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/" className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">Kembali ke Beranda</Link>
            <Link href="/contact" className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md">Kontak Admin</Link>
          </div>
        </div>

        <footer className="mt-6 text-xs text-gray-400">Versi: dokumentasi terbaru • {new Date().getFullYear()}</footer>
      </div>
    </div>
  );
}
