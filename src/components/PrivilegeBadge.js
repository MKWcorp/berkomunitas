'use client';
import { StarIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function PrivilegeBadge({ requiredPrivilege, userPrivileges = [], className = '' }) {
  if (!requiredPrivilege) return null;

  const hasAccess = userPrivileges.includes(requiredPrivilege) || 
                    userPrivileges.includes('admin');

  const getBadgeConfig = (privilege) => {
    const configs = {
      'berkomunitasplus': {
        text: 'BERKOMUNITAS+',
        icon: StarIcon,
        colors: hasAccess 
          ? 'bg-amber-500 text-white border-amber-600' 
          : 'bg-gray-100 text-gray-600 border-gray-300',
        description: 'Memerlukan membership Berkomunitas Plus'
      },
      'partner': {
        text: 'PARTNER',
        icon: StarIcon,
        colors: hasAccess 
          ? 'bg-blue-500 text-white border-blue-600' 
          : 'bg-gray-100 text-gray-600 border-gray-300',
        description: 'Khusus untuk Partner'
      },
      'admin': {
        text: 'ADMIN',
        icon: StarIcon,
        colors: hasAccess 
          ? 'bg-red-500 text-white border-red-600' 
          : 'bg-gray-100 text-gray-600 border-gray-300',
        description: 'Khusus untuk Administrator'
      }
    };
    
    return configs[privilege] || {
      text: privilege.toUpperCase(),
      icon: LockClosedIcon,
      colors: 'bg-gray-100 text-gray-600 border-gray-300',
      description: `Memerlukan privilege: ${privilege}`
    };
  };

  const config = getBadgeConfig(requiredPrivilege);
  const IconComponent = config.icon;

  return (
    <div className={`inline-flex items-center space-x-1 ${className}`}>
      {/* Badge */}
      <div className={`
        px-2 py-1 rounded-md border text-xs font-bold
        flex items-center space-x-1
        ${config.colors}
      `}>
        <IconComponent className="w-3 h-3" />
        <span>{config.text}</span>
        {!hasAccess && <LockClosedIcon className="w-3 h-3" />}
      </div>
      
      {/* Tooltip/Description */}
      <div className="relative group">
        <div className="cursor-help text-gray-400 hover:text-gray-600">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
            <div className="text-center">{config.description}</div>
            {!hasAccess && (
              <div className="text-amber-300 font-medium mt-1">
                {requiredPrivilege === 'berkomunitasplus' 
                  ? '🔓 Upgrade untuk mengakses'
                  : '🔒 Akses terbatas'
                }
              </div>
            )}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for showing multiple privileges
export function PrivilegesList({ privileges = [], userPrivileges = [], className = '' }) {
  if (!privileges || privileges.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {privileges.map((privilege, index) => (
        <PrivilegeBadge 
          key={index}
          requiredPrivilege={privilege}
          userPrivileges={userPrivileges}
        />
      ))}
    </div>
  );
}