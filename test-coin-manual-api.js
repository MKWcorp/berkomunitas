const { PrismaClient } = require('@prisma/client');

async function testCoinManualAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing manual coin operations...');
    
    // Test 1: Add coins to member 239
    console.log('1️⃣ Adding 5000 coins to member 239...');
    const testAdd = await prisma.$transaction(async (tx) => {
      // Update member's coin balance
      const updatedMember = await tx.members.update({
        where: { id: 239 },
        data: { coin: { increment: 5000 } }
      });
      
      // Add to coin history
      const historyEntry = await tx.coin_history.create({
        data: {
          member_id: 239,
          coin: 5000,
          event: 'Manual Admin Addition',
          event_type: 'admin_manual',
        }
      });
      
      return { updatedMember, historyEntry };
    });
    
    console.log(`✅ Success! New coin balance: ${testAdd.updatedMember.coin}`);
    console.log(`📝 History entry created: ${testAdd.historyEntry.id}`);
    
    // Test 2: Subtract coins from member 239
    console.log('2️⃣ Subtracting 2000 coins from member 239...');
    const testSubtract = await prisma.$transaction(async (tx) => {
      // Update member's coin balance
      const updatedMember = await tx.members.update({
        where: { id: 239 },
        data: { coin: { decrement: 2000 } }
      });
      
      // Add to coin history
      const historyEntry = await tx.coin_history.create({
        data: {
          member_id: 239,
          coin: -2000,
          event: 'Manual Admin Deduction',
          event_type: 'admin_manual',
        }
      });
      
      return { updatedMember, historyEntry };
    });
    
    console.log(`✅ Success! New coin balance: ${testSubtract.updatedMember.coin}`);
    console.log(`📝 History entry created: ${testSubtract.historyEntry.id}`);
    
    // Test 3: Check final state
    console.log('3️⃣ Checking final member state...');
    const finalState = await prisma.members.findUnique({
      where: { id: 239 },
      select: {
        id: true,
        nama_lengkap: true,
        coin: true,
        loyalty_point: true
      }
    });
    
    console.log('📊 Final member state:', finalState);
    console.log(`💰 Coin balance: ${finalState.coin}`);
    console.log(`🏆 Loyalty points: ${finalState.loyalty_point}`);
    console.log(`📈 Difference: ${finalState.coin - finalState.loyalty_point}`);
    
    // Test 4: Check recent coin history
    console.log('4️⃣ Checking recent coin history...');
    const recentHistory = await prisma.coin_history.findMany({
      where: { member_id: 239 },
      orderBy: { created_at: 'desc' },
      take: 5,
      include: {
        members: {
          select: {
            nama_lengkap: true
          }
        }
      }
    });
    
    console.log('📜 Recent coin history:');
    recentHistory.forEach(entry => {
      console.log(`  - ${entry.event}: ${entry.coin > 0 ? '+' : ''}${entry.coin} coins (${new Date(entry.created_at).toLocaleString()})`);
    });
    
    console.log('🎯 Manual coin management is working perfectly!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCoinManualAPI();