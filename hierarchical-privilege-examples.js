/**
 * Contoh implementasi Hierarchical Privilege System
 * Tanpa mengubah database - hanya logic aplikasi
 * Date: September 19, 2025
 */

import { checkUserPrivileges, canAccessFeature, requirePrivilege } from '../utils/hierarchicalPrivilegeChecker.js';

// ============================================================================
// 1. CONTOH DI API ROUTE - REWARD SYSTEM
// ============================================================================

// File: src/app/api/rewards/route.js
export async function GET(request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Dapatkan semua privilege info user
  const userPrivileges = await checkUserPrivileges(userId);
  
  // Query rewards berdasarkan privilege level
  const whereClause = {
    // Base condition
    status: 'active'
  };
  
  // Filter rewards berdasarkan privilege
  if (!userPrivileges.isBerkomunitasPlus) {
    // User biasa - hanya rewards tanpa requirement atau user-only
    whereClause.OR = [
      { required_privilege: null },
      { required_privilege: 'user' }
    ];
  } else if (!userPrivileges.isPartner) {
    // BerkomunitsPlus - termasuk user dan berkomunitasplus rewards
    whereClause.required_privilege = {
      in: [null, 'user', 'berkomunitasplus']
    };
  } else if (!userPrivileges.isAdmin) {
    // Partner - termasuk user, berkomunitasplus, partner rewards
    whereClause.required_privilege = {
      in: [null, 'user', 'berkomunitasplus', 'partner']
    };
  }
  // Admin bisa akses semua rewards (no filter)
  
  const rewards = await prisma.rewards.findMany({
    where: whereClause,
    select: {
      id: true,
      reward_name: true,
      point_cost: true,
      required_privilege: true,
      description: true
    }
  });
  
  // Tambahkan info privilege untuk frontend
  return NextResponse.json({
    rewards,
    userPrivileges: {
      current: userPrivileges.currentPrivilege,
      displayName: getPrivilegeDisplayName(userPrivileges.currentPrivilege),
      level: userPrivileges.privilegeLevel
    }
  });
}

// ============================================================================
// 2. CONTOH REWARD REDEMPTION DENGAN PRIVILEGE CHECK
// ============================================================================

// File: src/app/api/rewards/[id]/redeem/route.js
export async function POST(request, { params }) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const rewardId = parseInt(params.id);
  
  // Ambil reward info
  const reward = await prisma.rewards.findUnique({
    where: { id: rewardId },
    select: {
      id: true,
      reward_name: true,
      point_cost: true,
      required_privilege: true,
      stock: true
    }
  });
  
  if (!reward) {
    return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
  }
  
  // Check privilege access
  const userPrivileges = await checkUserPrivileges(userId);
  
  if (reward.required_privilege) {
    const hasAccess = hasPrivilege(userPrivileges.currentPrivilege, reward.required_privilege);
    
    if (!hasAccess) {
      return NextResponse.json({
        error: 'Insufficient privilege',
        message: `Reward ini membutuhkan privilege ${reward.required_privilege}`,
        userPrivilege: userPrivileges.currentPrivilege,
        requiredPrivilege: reward.required_privilege,
        suggestedAction: getUpgradeSuggestion(userPrivileges.currentPrivilege, reward.required_privilege)
      }, { status: 403 });
    }
  }
  
  // Lanjutkan dengan redemption logic...
  // (check points, stock, dll)
  
  return NextResponse.json({
    success: true,
    message: 'Reward berhasil di-redeem'
  });
}

// ============================================================================
// 3. CONTOH MIDDLEWARE UNTUK ROUTE PROTECTION
// ============================================================================

// File: src/app/admin-app/layout.js - Admin Section Protection
export default async function AdminLayout({ children }) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/login');
  }
  
  // Check admin privilege
  const accessCheck = await canAccessFeature(userId, 'user_management');
  
  if (!accessCheck.canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Akses Ditolak</h1>
          <p className="text-gray-600 mt-2">
            Anda membutuhkan privilege Admin untuk mengakses halaman ini.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Privilege saat ini: {accessCheck.userPrivilege}
          </p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

// ============================================================================
// 4. CONTOH COMPONENT DENGAN CONDITIONAL RENDERING
// ============================================================================

// File: src/components/RewardCard.js
import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

export function RewardCard({ reward }) {
  const { user } = useUser();
  const [userPrivileges, setUserPrivileges] = useState(null);
  const [canAccess, setCanAccess] = useState(false);
  
  useEffect(() => {
    if (user?.id) {
      // Fetch user privileges
      fetch('/api/user-privileges')
        .then(res => res.json())
        .then(data => {
          setUserPrivileges(data);
          
          // Check if user can access this reward
          if (reward.required_privilege) {
            const hasAccess = hasPrivilege(data.currentPrivilege, reward.required_privilege);
            setCanAccess(hasAccess);
          } else {
            setCanAccess(true);
          }
        });
    }
  }, [user?.id, reward.required_privilege]);
  
  return (
    <div className={`reward-card ${!canAccess ? 'opacity-50' : ''}`}>
      <h3>{reward.reward_name}</h3>
      <p>Point: {reward.point_cost}</p>
      
      {reward.required_privilege && (
        <div className="privilege-requirement">
          <span className="text-sm text-gray-500">
            Membutuhkan: {getPrivilegeDisplayName(reward.required_privilege)}
          </span>
          
          {!canAccess && (
            <div className="upgrade-suggestion mt-2">
              <p className="text-sm text-orange-600">
                Privilege Anda: {getPrivilegeDisplayName(userPrivileges?.currentPrivilege)}
              </p>
              <button className="upgrade-btn">
                Upgrade ke {getPrivilegeDisplayName(reward.required_privilege)}
              </button>
            </div>
          )}
        </div>
      )}
      
      <button 
        disabled={!canAccess}
        className={`redeem-btn ${!canAccess ? 'disabled' : ''}`}
      >
        {canAccess ? 'Tukar Reward' : 'Perlu Upgrade'}
      </button>
    </div>
  );
}

// ============================================================================
// 5. HOOK UNTUK REACT COMPONENTS
// ============================================================================

// File: src/hooks/usePrivileges.js
import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

export function usePrivileges() {
  const { user } = useUser();
  const [privileges, setPrivileges] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user?.id) {
      fetch('/api/user-privileges')
        .then(res => res.json())
        .then(data => {
          setPrivileges(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching privileges:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user?.id]);
  
  return {
    privileges,
    loading,
    isUser: privileges?.isUser || false,
    isBerkomunitasPlus: privileges?.isBerkomunitasPlus || false,
    isPartner: privileges?.isPartner || false,
    isAdmin: privileges?.isAdmin || false,
    currentPrivilege: privileges?.currentPrivilege || 'user'
  };
}

// ============================================================================
// 6. API ENDPOINT UNTUK FRONTEND
// ============================================================================

// File: src/app/api/user-privileges/route.js
export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const privileges = await checkUserPrivileges(userId);
    
    return NextResponse.json({
      success: true,
      ...privileges,
      displayName: getPrivilegeDisplayName(privileges.currentPrivilege),
      badgeColor: getPrivilegeBadgeColor(privileges.currentPrivilege)
    });
  } catch (error) {
    console.error('Error fetching privileges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// 7. CONTOH PENGGUNAAN DI NAVIGATION COMPONENT
// ============================================================================

// File: src/components/Navigation.js
export function Navigation() {
  const { privileges, loading } = usePrivileges();
  
  if (loading) {
    return <nav>Loading...</nav>;
  }
  
  return (
    <nav>
      <div className="nav-links">
        {/* Link yang bisa diakses semua user */}
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/tasks">Tasks</Link>
        <Link href="/rewards">Rewards</Link>
        
        {/* BerkomunitsPlus exclusive links */}
        {privileges.isBerkomunitasPlus && (
          <>
            <Link href="/premium-rewards">Premium Rewards ⭐</Link>
            <Link href="/exclusive-content">Konten Eksklusif</Link>
            <Link href="/analytics">Analytics</Link>
          </>
        )}
        
        {/* Partner links */}
        {privileges.isPartner && (
          <>
            <Link href="/partner-dashboard">Partner Dashboard</Link>
            <Link href="/business-tools">Business Tools</Link>
          </>
        )}
        
        {/* Admin links */}
        {privileges.isAdmin && (
          <>
            <Link href="/admin-app">Admin Panel</Link>
            <Link href="/user-management">User Management</Link>
          </>
        )}
      </div>
      
      {/* Privilege Badge */}
      <div className="user-info">
        <span className={`privilege-badge ${privileges.badgeColor}`}>
          {privileges.displayName}
        </span>
      </div>
    </nav>
  );
}