'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSSOUser } from '@/hooks/useSSOUser';
import { 
  GiftIcon,
  ClockIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/rewards-app/dashboard', icon: HomeIcon },
  { name: 'Kelola Hadiah', href: '/rewards-app/rewards', icon: GiftIcon },
  { name: 'Status', href: '/rewards-app/status', icon: ClockIcon },
];

export default function RewardsNavigation() {
  const pathname = usePathname();
  const { user } = useSSOUser();

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-lg border-b border-green-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo & Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="https://berkomunitas.com" className="flex items-center">
              <img 
                src="/logo-b.svg" 
                alt="Komunitas Komentar Logo" 
                className="w-8 h-8 object-contain"
              />
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-green-100 text-green-700 shadow-sm'
                        : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side - User Profile */}
          <div className="flex items-center">
            {/* User Profile Dropdown */}
            {user && (              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">
                    {user.name || 'Admin'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.email}
                  </div>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-green-600">
                    {(user.name || 'A')[0].toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 pt-2">
          <div className="flex space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-green-100 text-green-700 shadow-sm'
                      : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}