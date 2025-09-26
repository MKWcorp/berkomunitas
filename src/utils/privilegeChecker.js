import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Definisi hierarki privilege (semakin tinggi angka = semakin tinggi akses)
const PRIVILEGE_HIERARCHY = {
  'user': 1,
  'berkomunitasplus': 2,
  'partner': 3,
  'admin': 4
};

/**
 * Cek apakah user memiliki privilege tertentu atau lebih tinggi
 * @param {string} userPrivilege - Privilege yang dimiliki user
 * @param {string} requiredPrivilege - Privilege yang dibutuhkan
 * @returns {boolean}
 */
export function hasPrivilege(userPrivilege, requiredPrivilege) {
  const userLevel = PRIVILEGE_HIERARCHY[userPrivilege] || 0;
  const requiredLevel = PRIVILEGE_HIERARCHY[requiredPrivilege] || 0;
  
  return userLevel >= requiredLevel;
}

export async function checkUserPrivileges(user_clerk_id) {
  try {
    // 1. Ambil privilege aktif dari database (hanya satu yang aktif)
    const userPrivilegeRecord = await prisma.user_privileges.findFirst({
      where: {
        clerk_id: user_clerk_id,
        is_active: true,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ]
      }
    });

    const currentPrivilege = userPrivilegeRecord?.privilege || 'user';

    // 2. Generate privilege berdasarkan hierarki
    // Privilege tinggi otomatis punya akses privilege rendah
    const privileges = {
      // Current privilege info
      currentPrivilege,
      privilegeLevel: PRIVILEGE_HIERARCHY[currentPrivilege],
      
      // Hierarki akses - berkomunitasplus otomatis punya akses user, dst.
      isUser: hasPrivilege(currentPrivilege, 'user'),                    // Semua orang
      isBerkomunitasPlus: hasPrivilege(currentPrivilege, 'berkomunitasplus'), // berkomunitasplus+ 
      isPartner: hasPrivilege(currentPrivilege, 'partner'),              // partner+
      isAdmin: hasPrivilege(currentPrivilege, 'admin'),                  // admin only
      
      // Exact privilege check (untuk UI badge, dll)
      isExactlyUser: currentPrivilege === 'user',
      isExactlyBerkomunitasPlus: currentPrivilege === 'berkomunitasplus',
      isExactlyPartner: currentPrivilege === 'partner',
      isExactlyAdmin: currentPrivilege === 'admin'
    };

    return privileges;

  } catch (error) {
    console.error('Error checking user privileges:', error);
    
    // Default fallback
    return {
      currentPrivilege: 'user',
      privilegeLevel: 1,
      isUser: true,
      isBerkomunitasPlus: false,
      isPartner: false,
      isAdmin: false,
      isExactlyUser: true,
      isExactlyBerkomunitasPlus: false,
      isExactlyPartner: false,
      isExactlyAdmin: false
    };
  }
}

/**
 * Utility function untuk mendapatkan nama privilege yang user-friendly
 * @param {string} privilege 
 * @returns {string}
 */
export function getPrivilegeDisplayName(privilege) {
  const displayNames = {
    'user': 'Member',
    'berkomunitasplus': 'BerkomunitsPlus ⭐',
    'partner': 'Partner 🤝',
    'admin': 'Administrator 👑'
  };
  
  return displayNames[privilege] || 'Unknown';
}

/**
 * Get all hierarchical privileges that should be displayed for a user
 * @param {string} userPrivilege - The user's current privilege level
 * @returns {Array} Array of privilege strings that should be shown as badges
 */
export function getDisplayPrivileges(userPrivilege) {
  const privileges = [];
  
  // Show ALL hierarchical levels that user has access to
  if (hasPrivilege(userPrivilege, 'admin')) {
    // Admin shows: user, berkomunitasplus, partner, admin
    privileges.push('user', 'berkomunitasplus', 'partner', 'admin');
  } else if (hasPrivilege(userPrivilege, 'partner')) {
    // Partner shows: user, berkomunitasplus, partner
    privileges.push('user', 'berkomunitasplus', 'partner');
  } else if (hasPrivilege(userPrivilege, 'berkomunitasplus')) {
    // BerkomunitsPlus shows: user, berkomunitasplus
    privileges.push('user', 'berkomunitasplus');
  } else {
    // Regular user shows: user
    privileges.push('user');
  }
  
  return privileges;
}

/**
 * Utility untuk mendapatkan warna badge privilege
 * @param {string} privilege 
 * @returns {string}
 */
export function getPrivilegeBadgeColor(privilege) {
  const colors = {
    'user': 'gray',
    'berkomunitasplus': 'gold',
    'partner': 'blue',
    'admin': 'red'
  };
  
  return colors[privilege] || 'gray';
}

/**
 * Cek apakah user bisa akses fitur tertentu
 * @param {string} user_clerk_id - Clerk ID user
 * @param {string} featureName - Nama fitur yang ingin diakses
 * @returns {Promise<Object>} - Status akses dan info
 */
export async function canAccessFeature(user_clerk_id, featureName) {
  const userPrivileges = await checkUserPrivileges(user_clerk_id);
  
  // Definisi fitur dan minimum privilege yang dibutuhkan
  const featureRequirements = {
    // User features (accessible by everyone)
    'basic_rewards': 'user',
    'comment_system': 'user',
    'profile_creation': 'user',
    'task_submission': 'user',
    
    // BerkomunitsPlus features
    'premium_rewards': 'berkomunitasplus',
    'priority_support': 'berkomunitasplus',
    'exclusive_content': 'berkomunitasplus',
    'advanced_analytics': 'berkomunitasplus',
    'special_badges': 'berkomunitasplus',
    
    // Partner features
    'partner_dashboard': 'partner',
    'business_tools': 'partner',
    'affiliate_system': 'partner',
    'bulk_operations': 'partner',
    
    // Admin features
    'user_management': 'admin',
    'system_config': 'admin',
    'privilege_management': 'admin',
    'database_access': 'admin'
  };
  
  const requiredPrivilege = featureRequirements[featureName];
  
  if (!requiredPrivilege) {
    return {
      canAccess: true, // Feature tidak ada requirement = accessible
      reason: 'No privilege requirement',
      userPrivilege: userPrivileges.currentPrivilege
    };
  }
  
  const canAccess = hasPrivilege(userPrivileges.currentPrivilege, requiredPrivilege);
  
  return {
    canAccess,
    reason: canAccess 
      ? `Access granted (${userPrivileges.currentPrivilege} >= ${requiredPrivilege})`
      : `Access denied (${userPrivileges.currentPrivilege} < ${requiredPrivilege})`,
    userPrivilege: userPrivileges.currentPrivilege,
    requiredPrivilege,
    suggestedUpgrade: canAccess ? null : getUpgradeSuggestion(userPrivileges.currentPrivilege, requiredPrivilege)
  };
}

/**
 * Dapatkan saran upgrade privilege
 * @param {string} currentPrivilege 
 * @param {string} requiredPrivilege 
 * @returns {string|null}
 */
function getUpgradeSuggestion(currentPrivilege, requiredPrivilege) {
  const upgradePaths = {
    'user': {
      'berkomunitasplus': 'upgrade_to_berkomunitasplus',
      'partner': 'upgrade_to_berkomunitasplus', // Step by step
      'admin': 'contact_admin'
    },
    'berkomunitasplus': {
      'partner': 'apply_for_partner',
      'admin': 'contact_admin'
    },
    'partner': {
      'admin': 'contact_admin'
    }
  };
  
  return upgradePaths[currentPrivilege]?.[requiredPrivilege] || 'contact_admin';
}

// Export konstanta untuk digunakan di tempat lain
export { PRIVILEGE_HIERARCHY };

// Fungsi untuk memberikan privilege
export async function grantPrivilege(user_clerk_id, privilege, grantedBy = 'system') {
  try {
    // Check if privilege already exists
    const existing = await prisma.user_privileges.findFirst({
      where: {
        clerk_id: user_clerk_id,
        privilege: privilege
      }
    });

    if (existing) {
      // Update existing privilege
      await prisma.user_privileges.update({
        where: { id: existing.id },
        data: {
          is_active: true,
          granted_at: new Date(),
          granted_by: grantedBy,
          expires_at: null
        }
      });
    } else {
      // Create new privilege
      await prisma.user_privileges.create({
        data: {
          clerk_id: user_clerk_id,
          privilege: privilege,
          granted_by: grantedBy,
          is_active: true
        }
      });
    }
  } catch (error) {
    console.error('Error granting privilege:', error);
  }
}

// Fungsi untuk mencabut privilege
export async function revokePrivilege(user_clerk_id, privilege) {
  try {
    await prisma.user_privileges.updateMany({
      where: {
        clerk_id: user_clerk_id, // Gunakan clerk_id sesuai schema yang baru
        privilege: privilege
      },
      data: {
        is_active: false
      }
    });
  } catch (error) {
    console.error('Error revoking privilege:', error);
  }
}

export function getPrivilegeLabels(privileges) {
  const labels = [];
  
  if (privileges.isAdmin) {
    labels.push({
      text: 'ADMIN',
      color: 'bg-red-500 text-white',
      icon: '👑'
    });
  }
  
  if (privileges.isPartner) {
    labels.push({
      text: 'PARTNER',
      color: 'bg-blue-500 text-white',
      icon: '🤝'
    });
  }
  
  if (privileges.isBerkomunitasPlus) {
    labels.push({
      text: 'BERKOMUNITAS+',
      color: 'bg-amber-500 text-white',
      icon: '⭐'
    });
  }
  
  if (privileges.isUser) {
    labels.push({
      text: 'USER',
      color: 'bg-green-500 text-white',
      icon: '👤'
    });
  }
  
  return labels;
} 