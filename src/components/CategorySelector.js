'use client';
import { useState, useEffect } from 'react';
import { 
  CubeIcon,
  SparklesIcon,
  ShoppingBagIcon,
  CakeIcon,
  GlobeAltIcon,
  StarIcon,
  GiftIcon
} from '@heroicons/react/24/outline';

const iconMap = {
  'DevicePhoneMobileIcon': CubeIcon,
  'ShoppingBagIcon': ShoppingBagIcon,
  'CakeIcon': CakeIcon,
  'GlobeAltIcon': GlobeAltIcon,
  'StarIcon': StarIcon,
  'GiftIcon': GiftIcon,
  'SparklesIcon': SparklesIcon
};

export default function CategorySelector({ selectedCategory, onCategoryChange, userPrivileges = [] }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/reward-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color, isSelected) => {
    const colorMap = {
      blue: isSelected 
        ? 'bg-blue-500 text-white border-blue-600' 
        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      purple: isSelected 
        ? 'bg-purple-500 text-white border-purple-600' 
        : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      yellow: isSelected 
        ? 'bg-yellow-500 text-white border-yellow-600' 
        : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
      green: isSelected 
        ? 'bg-green-500 text-white border-green-600' 
        : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      amber: isSelected 
        ? 'bg-amber-500 text-white border-amber-600' 
        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
      pink: isSelected 
        ? 'bg-pink-500 text-white border-pink-600' 
        : 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
      red: isSelected 
        ? 'bg-red-500 text-white border-red-600' 
        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
    };
    return colorMap[color] || colorMap.blue;
  };

  const isExclusiveCategory = (categoryName) => {
    return categoryName.toLowerCase().includes('eksklusif') || categoryName.toLowerCase().includes('plus');
  };

  const canAccessCategory = (category) => {
    if (!isExclusiveCategory(category.name)) return true;
    return userPrivileges.includes('admin') || 
           userPrivileges.includes('partner') || 
           userPrivileges.includes('berkomunitasplus');
  };

  if (loading) {
    return (
      <div className="flex space-x-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Filter Kategori</h3>
      
      <div className="flex flex-wrap gap-2">
        {/* All Categories Button */}
        <button
          onClick={() => onCategoryChange(null)}
          className={`
            px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200
            flex items-center space-x-2
            ${selectedCategory === null 
              ? 'bg-gray-500 text-white border-gray-600' 
              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }
          `}
        >
          <SparklesIcon className="w-4 h-4" />
          <span>Semua</span>
        </button>

        {/* Category Buttons */}
        {categories.map(category => {
          const IconComponent = iconMap[category.icon] || GiftIcon;
          const isSelected = selectedCategory === category.id;
          const hasAccess = canAccessCategory(category);
          
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              disabled={!hasAccess}
              className={`
                px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200
                flex items-center space-x-2
                ${hasAccess 
                  ? getColorClasses(category.color, isSelected)
                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }
                ${hasAccess ? 'hover:scale-105' : ''}
              `}
            >
              <IconComponent className="w-4 h-4" />
              <span>{category.name}</span>
              
              {/* Exclusive Badge */}
              {isExclusiveCategory(category.name) && (
                <div className="flex items-center">
                  <StarIcon className="w-3 h-3 ml-1" />
                  {!hasAccess && (
                    <span className="text-xs ml-1">🔒</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Privilege Info */}
      {categories.some(cat => isExclusiveCategory(cat.name)) && (
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center space-x-1 mb-1">
            <StarIcon className="w-3 h-3" />
            <span className="font-medium">Kategori Eksklusif:</span>
          </div>
          <p>
            Memerlukan privilege khusus (Berkomunitas+, Partner, atau Admin) untuk mengakses hadiah eksklusif.
            {!userPrivileges.includes('berkomunitasplus') && 
             !userPrivileges.includes('partner') && 
             !userPrivileges.includes('admin') && (
              <span className="text-amber-600 font-medium"> Upgrade ke Berkomunitas+ untuk akses penuh!</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}