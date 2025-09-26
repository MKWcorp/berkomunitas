// Example implementation di API routes menggunakan CoinLoyaltyManager
// Ganti semua operasi point dengan unified manager

// src/app/api/points/add/route.js
import { CoinLoyaltyManager } from '@/lib/coinLoyaltyManager';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { memberId, points, event, eventType } = await request.json();
    
    // ✅ Menggunakan unified manager (auto-sync coin)
    const result = await CoinLoyaltyManager.addLoyaltyPoints(
      memberId, 
      points, 
      event, 
      eventType || 'manual_admin'
    );
    
    return NextResponse.json({
      success: true,
      message: `Added ${points} points to member ${memberId}`,
      data: {
        memberId: result.member.id,
        loyalty_point: result.member.loyalty_point,
        coin: result.member.coin,
        isConsistent: result.member.coin === result.member.loyalty_point
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 400 });
  }
}

// src/app/api/rewards/redeem/route.js
import { CoinLoyaltyManager } from '@/lib/coinLoyaltyManager';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { memberId, rewardId, rewardName, cost } = await request.json();
    
    // 💰 Menggunakan unified manager (coin berkurang, loyalty tetap)
    const result = await CoinLoyaltyManager.redeemCoins(
      memberId, 
      cost, 
      rewardId, 
      rewardName
    );
    
    return NextResponse.json({
      success: true,
      message: `Successfully redeemed ${rewardName}`,
      data: {
        memberId: result.member.id,
        loyalty_point: result.member.loyalty_point, // unchanged
        coin: result.member.coin, // reduced
        redemptionId: result.redemption.id
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 400 });
  }
}

// src/app/api/admin/sync-coins/route.js
import { CoinLoyaltyManager } from '@/lib/coinLoyaltyManager';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { memberId } = await request.json();
    
    let result;
    if (memberId) {
      // Sync specific member
      result = await CoinLoyaltyManager.syncMemberCoinsWithLoyalty(memberId);
    } else {
      // Sync all members
      result = await CoinLoyaltyManager.syncAllMembers();
    }
    
    return NextResponse.json({
      success: true,
      message: memberId ? `Synced member ${memberId}` : `Synced ${result.length} members`,
      data: result
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 400 });
  }
}

// src/app/api/member/points-summary/[id]/route.js
import { CoinLoyaltyManager } from '@/lib/coinLoyaltyManager';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const memberId = parseInt(params.id);
    
    const summary = await CoinLoyaltyManager.getMemberPointsSummary(memberId);
    
    return NextResponse.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 400 });
  }
}

// Example usage di task completion
// src/app/api/tasks/complete/route.js
import { addPoints } from '@/lib/coinLoyaltyManager';

export async function POST(request) {
  try {
    const { taskId, memberId } = await request.json();
    
    // ... task completion logic
    
    // ✅ Add points using unified system
    await addPoints(memberId, 10, 'Penyelesaian Tugas');
    
    return NextResponse.json({
      success: true,
      message: 'Task completed and points added'
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 400 });
  }
}
