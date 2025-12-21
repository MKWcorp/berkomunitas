/**
 * Enhanced Privilege Checker dengan Sistem Hierarki
 * Tidak perlu mengubah database - hanya logic di aplikasi
 * Date: September 19, 2025
 */

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

/**
 * Enhanced privilege checker - berkomunitasplus otomatis punya akses user, dst.
 * @param {string} user_clerk_id - Clerk ID dari user
 * @returns {Object} - Object dengan semua privilege status
 */
export async function checkUserPrivileges(user_clerk_id) {
  try {
    // 1. Ambil privilege aktif dari database
    const userPrivilegeRecord = await prisma.user_privileges.findFirst({
      where: { google_id: user_clerk_id,
        is_active: true,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ]
      }
    });

    const currentPrivilege = userPrivilegeRecord?.privilege || 'user';

    // 2. Generate privilege berdasarkan hierarki
    const privileges = {
      // Current privilege info
      currentPrivilege,
      privilegeLevel: PRIVILEGE_HIERARCHY[currentPrivilege],
      
      // Hierarki akses - privilege tinggi otomatis punya akses privilege rendah
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

/**
 * Middleware untuk route protection berdasarkan privilege
 * @param {string} requiredPrivilege 
 * @returns {Function}
 */
export function requirePrivilege(requiredPrivilege) {
  return async (request, response, next) => {
    try {
      const { userId } = await auth(); // Clerk auth
      
      if (!userId) {
        return response.status(401).json({ error: 'Unauthorized' });
      }
      
      const accessCheck = await canAccessFeature(userId, `privilege_${requiredPrivilege}`);
      
      if (!accessCheck.canAccess) {
        return response.status(403).json({ 
          error: 'Insufficient privilege',
          required: requiredPrivilege,
          current: accessCheck.userPrivilege,
          suggestion: accessCheck.suggestedUpgrade
        });
      }
      
      // Attach privilege info ke request untuk use di route handler
      request.userPrivileges = await checkUserPrivileges(userId);
      
      next();
    } catch (error) {
      console.error('Privilege check error:', error);
      return response.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Export konstanta untuk digunakan di tempat lain
export { PRIVILEGE_HIERARCHY };

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