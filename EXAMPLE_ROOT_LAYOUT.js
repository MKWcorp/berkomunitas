// src/app/layout.js - Root layout dengan auto glass
import { GlobalGlassProvider } from '@/components/AutoGlassWrapper';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <GlobalGlassProvider>
          {/* SEMUA HALAMAN OTOMATIS GLASS! */}
          {children}
        </GlobalGlassProvider>
      </body>
    </html>
  );
}

// Sekarang setiap halaman otomatis dapat:
// ✅ Full screen glass background
// ✅ Animated floating orbs  
// ✅ Auto-responsive
// ✅ Route-based theme variants
// ✅ Performance optimized
