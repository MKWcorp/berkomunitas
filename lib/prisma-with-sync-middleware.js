// Prisma Middleware untuk memastikan sinkronisasi coin dan loyalty_point
// Implementasi di lib/prisma.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Middleware untuk auto-sync coin dengan loyalty_point
prisma.$use(async (params, next) => {
  // 1. Handle loyalty_point_history INSERT (menambah points)
  if (params.model === 'loyalty_point_history' && params.action === 'create') {
    const result = await next(params);
    
    // Auto-increment coin sesuai dengan point yang ditambahkan
    await prisma.members.update({
      where: { id: params.args.data.member_id },
      data: { coin: { increment: params.args.data.point } }
    });
    
    console.log(`✅ Coin synced: +${params.args.data.point} for member ${params.args.data.member_id}`);
    return result;
  }
  
  // 2. Handle reward_redemptions CREATE (mengurangi coin)
  if (params.model === 'reward_redemptions' && params.action === 'create') {
    const result = await next(params);
    
    // Kurangi coin tapi JANGAN kurangi loyalty_point
    const redemption = await prisma.reward_redemptions.findUnique({
      where: { id: result.id },
      include: { rewards: true }
    });
    
    await prisma.members.update({
      where: { id: redemption.id_member },
      data: { coin: { decrement: redemption.rewards.cost } }
    });
    
    console.log(`💰 Coin redeemed: -${redemption.rewards.cost} for member ${redemption.id_member}`);
    return result;
  }
  
  // 3. Handle manual member updates (validation)
  if (params.model === 'members' && params.action === 'update') {
    const result = await next(params);
    
    // Validasi: coin tidak boleh > loyalty_point
    const member = await prisma.members.findUnique({
      where: { id: params.args.where.id },
      select: { coin: true, loyalty_point: true, nama_lengkap: true }
    });
    
    if (member && member.coin > member.loyalty_point) {
      console.warn(`⚠️ Warning: Coin (${member.coin}) > Loyalty (${member.loyalty_point}) for ${member.nama_lengkap}`);
      
      // Auto-fix: Set coin = loyalty_point
      await prisma.members.update({
        where: { id: params.args.where.id },
        data: { coin: member.loyalty_point }
      });
      
      console.log(`🔧 Auto-fixed: Coin set to ${member.loyalty_point} for ${member.nama_lengkap}`);
    }
    
    return result;
  }
  
  return next(params);
});

// Utility function untuk sync semua data
export async function syncAllCoinWithLoyalty() {
  console.log('🔄 Starting bulk coin-loyalty sync...');
  
  const inconsistentMembers = await prisma.members.findMany({
    where: {
      coin: { not: { equals: prisma.members.fields.loyalty_point } }
    }
  });
  
  console.log(`Found ${inconsistentMembers.length} members to sync`);
  
  for (const member of inconsistentMembers) {
    await prisma.members.update({
      where: { id: member.id },
      data: { coin: member.loyalty_point }
    });
    
    console.log(`✅ Synced member ${member.id}: ${member.coin} → ${member.loyalty_point}`);
  }
  
  console.log('🎉 Bulk sync completed!');
}

// Utility function untuk validate consistency
export async function validateCoinLoyaltyConsistency() {
  const inconsistentCount = await prisma.members.count({
    where: {
      coin: { not: { equals: prisma.members.fields.loyalty_point } }
    }
  });
  
  if (inconsistentCount > 0) {
    console.warn(`⚠️ Found ${inconsistentCount} inconsistent members`);
    return false;
  }
  
  console.log('✅ All members are consistent');
  return true;
}

// Cron job function (bisa dipanggil setiap jam)
export async function hourlyConsistencyCheck() {
  const isConsistent = await validateCoinLoyaltyConsistency();
  
  if (!isConsistent) {
    console.log('🔧 Running auto-sync...');
    await syncAllCoinWithLoyalty();
    
    // Send notification (optional)
    // await sendSlackNotification('Coin-loyalty sync executed');
  }
}

export default prisma;
