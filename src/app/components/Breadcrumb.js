'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Breadcrumb() {
  const pathname = usePathname();
  
  const getBreadcrumbItems = () => {
    const paths = pathname.split('/').filter(Boolean);
    const items = [{ name: 'Home', path: '/' }];
    
    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const name = path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');
      items.push({ name, path: currentPath });
    });
    
    return items;
  };

  const items = getBreadcrumbItems();

  return (
    <nav className="flex items-center space-x-2 text-xs md:text-sm text-gray-600 mb-2 md:mb-4 overflow-x-auto whitespace-nowrap">
      {items.map((item, index) => (
        <div key={item.path} className="flex items-center">
          {index > 0 && <span className="mx-1 md:mx-2">/</span>}
          {index === items.length - 1 ? (
            <span className="text-gray-900 font-medium truncate max-w-[120px] md:max-w-none">{item.name}</span>
          ) : (
            <Link 
              href={item.path} 
              className="hover:text-blue-600 transition-colors truncate max-w-[120px] md:max-w-none"
            >
              {item.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
} 