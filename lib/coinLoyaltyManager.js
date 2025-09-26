// Unified API Helper untuk mengelola coin dan loyalty_point
// Pastikan semua operasi points melalui helper ini

import prisma from './prisma.js';

export class CoinLoyaltyManager {
  
  // ✅ Method untuk menambah loyalty_point (otomatis sync coin)
  static async addLoyaltyPoints(memberId, points, event, eventType = 'system') {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Tambah loyalty_point_history
        const history = await tx.loyalty_point_history.create({
          data: {
            member_id: memberId,
            point: points,
            event: event,
            event_type: eventType
          }
        });
        
        // 2. Update members: loyalty_point DAN coin bertambah
        const member = await tx.members.update({
          where: { id: memberId },
          data: {
            loyalty_point: { increment: points },
            coin: { increment: points }  // SYNC: coin ikut bertambah
          }
        });
        
        return { history, member };
      });
      
      console.log(`✅ Added ${points} points to member ${memberId} (${event})`);
      console.log(`   Loyalty: ${result.member.loyalty_point}, Coin: ${result.member.coin}`);
      
      return result;
    } catch (error) {
      console.error('❌ Error adding loyalty points:', error);
      throw error;
    }
  }
  
  // 💰 Method untuk redeem coin (loyalty_point TIDAK berubah)
  static async redeemCoins(memberId, coinsToSpend, rewardId, rewardName) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Cek apakah member punya cukup coin
        const member = await tx.members.findUnique({
          where: { id: memberId },
          select: { coin: true, loyalty_point: true, nama_lengkap: true }
        });
        
        if (!member) {
          throw new Error(`Member ${memberId} not found`);
        }
        
        if (member.coin < coinsToSpend) {
          throw new Error(`Insufficient coins. Has: ${member.coin}, Need: ${coinsToSpend}`);
        }
        
        // 2. Kurangi coin SAJA (loyalty_point tetap)
        const updatedMember = await tx.members.update({
          where: { id: memberId },
          data: {
            coin: { decrement: coinsToSpend }
            // loyalty_point TIDAK berubah!
          }
        });
        
        // 3. Record redemption
        const redemption = await tx.reward_redemptions.create({
          data: {
            id_member: memberId,
            id_reward: rewardId,
            points_spent: coinsToSpend,
            status: 'completed'
          }
        });
        
        return { member: updatedMember, redemption };
      });
      
      console.log(`💰 Member ${memberId} redeemed ${coinsToSpend} coins for ${rewardName}`);
      console.log(`   Loyalty: ${result.member.loyalty_point} (unchanged), Coin: ${result.member.coin}`);
      
      return result;
    } catch (error) {
      console.error('❌ Error redeeming coins:', error);
      throw error;
    }
  }
  
  // 🔄 Method untuk manual sync (emergency fix)
  static async syncMemberCoinsWithLoyalty(memberId) {
    try {
      const member = await prisma.members.findUnique({
        where: { id: memberId },
        select: { loyalty_point: true, coin: true, nama_lengkap: true }
      });
      
      if (!member) {
        throw new Error(`Member ${memberId} not found`);
      }
      
      if (member.coin !== member.loyalty_point) {
        const updatedMember = await prisma.members.update({
          where: { id: memberId },
          data: { coin: member.loyalty_point }
        });
        
        console.log(`🔧 Synced member ${memberId}: ${member.coin} → ${member.loyalty_point}`);
        return updatedMember;
      }
      
      console.log(`✅ Member ${memberId} already synced`);
      return member;
    } catch (error) {
      console.error('❌ Error syncing member coins:', error);
      throw error;
    }
  }
  
  // 📊 Method untuk bulk sync semua member
  static async syncAllMembers() {
    try {
      const inconsistentMembers = await prisma.members.findMany({
        where: {
          NOT: {
            coin: { equals: prisma.members.fields.loyalty_point }
          }
        }
      });
      
      console.log(`🔄 Found ${inconsistentMembers.length} members to sync`);
      
      const results = [];
      for (const member of inconsistentMembers) {
        const updated = await this.syncMemberCoinsWithLoyalty(member.id);
        results.push(updated);
      }
      
      console.log(`✅ Successfully synced ${results.length} members`);
      return results;
    } catch (error) {
      console.error('❌ Error bulk syncing:', error);
      throw error;
    }
  }
  
  // 📈 Method untuk get member points summary
  static async getMemberPointsSummary(memberId) {
    try {
      const member = await prisma.members.findUnique({
        where: { id: memberId },
        select: {
          id: true,
          nama_lengkap: true,
          loyalty_point: true,
          coin: true,
          tanggal_daftar: true
        }
      });
      
      if (!member) {
        throw new Error(`Member ${memberId} not found`);
      }
      
      const recentHistory = await prisma.loyalty_point_history.findMany({
        where: { member_id: memberId },
        orderBy: { created_at: 'desc' },
        take: 5
      });
      
      const redemptions = await prisma.reward_redemptions.findMany({
        where: { id_member: memberId },
        include: { rewards: true },
        orderBy: { created_at: 'desc' },
        take: 5
      });
      
      return {
        member,
        isConsistent: member.coin <= member.loyalty_point,
        recentHistory,
        redemptions
      };
    } catch (error) {
      console.error('❌ Error getting member summary:', error);
      throw error;
    }
  }
}

// ⚡ Quick helper functions
export async function addPoints(memberId, points, event) {
  return CoinLoyaltyManager.addLoyaltyPoints(memberId, points, event);
}

export async function spendCoins(memberId, coins, rewardId, rewardName) {
  return CoinLoyaltyManager.redeemCoins(memberId, coins, rewardId, rewardName);
}

export async function fixSync(memberId = null) {
  if (memberId) {
    return CoinLoyaltyManager.syncMemberCoinsWithLoyalty(memberId);
  } else {
    return CoinLoyaltyManager.syncAllMembers();
  }
}
