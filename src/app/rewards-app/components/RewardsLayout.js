'use client';
import { usePathname } from 'next/navigation';
import { Inter } from 'next/font/google';
import RewardsNavigation from './RewardsNavigation';

const inter = Inter({ subsets: ['latin'] });

export default function RewardsLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className={`min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 ${inter.className}`}>
      <RewardsNavigation />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
