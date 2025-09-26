// Production safety check - validate database before migration
// Jalankan ini SEBELUM melakukan perubahan apapun

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function productionPreflightCheck() {
  try {
    console.log('🔍 PRODUCTION PREFLIGHT CHECK');
    console.log('=' . repeat(50));
    console.log('🚨 Checking production database before migration...\n');
    
    // 1. Verify database connection
    console.log('📡 1. DATABASE CONNECTION:');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('   ✅ Database connection successful\n');
    
    // 2. Check current member count and sample data
    console.log('👥 2. MEMBER DATA VALIDATION:');
    const totalMembers = await prisma.members.count();
    console.log(`   Total members: ${totalMembers}`);
    
    if (totalMembers === 0) {
      console.log('   ⚠️ WARNING: No members found in production!');
      console.log('   Please verify you are connected to the correct database.\n');
      return false;
    }
    
    // Sample of member data
    const sampleMembers = await prisma.members.findMany({
      select: { id: true, nama_lengkap: true, loyalty_point: true, coin: true },
      take: 3,
      orderBy: { loyalty_point: 'desc' }
    });
    
    console.log('   Sample members:');
    sampleMembers.forEach(m => {
      console.log(`     - ${m.nama_lengkap}: L${m.loyalty_point} C${m.coin || 'null'}`);
    });
    
    // 3. Check if migration already applied
    console.log('\n🔍 3. MIGRATION STATUS CHECK:');
    
    try {
      await prisma.$queryRaw`SELECT 1 FROM transaction_types LIMIT 1`;
      console.log('   ⚠️ WARNING: Migration tables already exist!');
      console.log('   Skipping migration to prevent conflicts.\n');
      return false;
    } catch (error) {
      console.log('   ✅ Migration tables not found - ready for fresh migration\n');
    }
    
    // 4. Check existing loyalty_point_history
    console.log('📋 4. EXISTING DATA ANALYSIS:');
    const historyCount = await prisma.loyalty_point_history.count();
    console.log(`   Loyalty point history records: ${historyCount}`);
    
    if (historyCount > 0) {
      const recentHistory = await prisma.loyalty_point_history.findMany({
        take: 3,
        orderBy: { created_at: 'desc' },
        include: { members: { select: { nama_lengkap: true } } }
      });
      
      console.log('   Recent loyalty history:');
      recentHistory.forEach(h => {
        console.log(`     - ${h.members.nama_lengkap}: +${h.point} (${h.event})`);
      });
    }
    
    // 5. Check coin column existence
    console.log('\n🪙 5. COIN COLUMN STATUS:');
    const memberWithCoin = await prisma.members.findFirst({
      select: { coin: true }
    });
    
    if (memberWithCoin && memberWithCoin.coin !== undefined) {
      console.log('   ✅ Coin column exists in members table');
    } else {
      console.log('   ❌ Coin column missing - need to add it first');
    }
    
    // 6. Final go/no-go decision
    console.log('\n' + '='.repeat(50));
    console.log('🎯 PREFLIGHT SUMMARY:');
    
    if (totalMembers > 0 && historyCount > 0) {
      console.log('✅ READY FOR PRODUCTION MIGRATION');
      console.log('   - Database connection: OK');
      console.log('   - Member data: OK');
      console.log('   - History data: OK');
      console.log('   - Migration status: Ready');
      console.log('\n🚀 Safe to proceed with production migration!');
      return true;
    } else {
      console.log('❌ NOT READY FOR MIGRATION');
      console.log('   Please verify database connection and data.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Preflight check failed:', error.message);
    console.log('\n🚨 DO NOT PROCEED with migration!');
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Export for use in other scripts
if (require.main === module) {
  productionPreflightCheck();
}

module.exports = { productionPreflightCheck };
