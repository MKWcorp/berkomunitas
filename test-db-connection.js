/**
 * Database Connection Test
 * Test koneksi ke database dan cek basic functionality
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function testConnection() {
  console.log('🔌 Testing Database Connection...\n');

  try {
    // 1. Test basic connection
    console.log('1️⃣ Testing basic connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!\n');

    // 2. Test simple query
    console.log('2️⃣ Testing simple query...');
    const memberCount = await prisma.members.count();
    console.log(`✅ Found ${memberCount} members in database\n`);

    // 3. Test specific table access
    console.log('3️⃣ Testing table access...');
    
    const tables = [
      { name: 'members', model: prisma.members },
      { name: 'rewards', model: prisma.rewards },
      { name: 'reward_redemptions', model: prisma.reward_redemptions }
    ];

    for (const table of tables) {
      try {
        const count = await table.model.count();
        console.log(`✅ ${table.name}: ${count} records`);
      } catch (error) {
        console.log(`❌ ${table.name}: Error - ${error.message}`);
      }
    }

    console.log('');

    // 4. Test sample data retrieval
    console.log('4️⃣ Testing sample data retrieval...');
    
    const sampleMember = await prisma.members.findFirst({
      select: {
        id: true,
        nama_lengkap: true,
        clerk_id: true,
        loyalty_point: true,
        coin: true,
        tanggal_daftar: true
      }
    });

    if (sampleMember) {
      console.log('✅ Sample member data retrieved:');
      console.log(`   ID: ${sampleMember.id}`);
      console.log(`   Clerk ID: ${sampleMember.clerk_id?.substring(0, 8)}...`);
      console.log(`   Name: ${sampleMember.nama_lengkap || 'N/A'}`);
      console.log(`   Loyalty: ${sampleMember.loyalty_point}`);
      console.log(`   Coin: ${sampleMember.coin}`);
      console.log(`   Created: ${sampleMember.tanggal_daftar}`);
    } else {
      console.log('⚠️  No member data found');
    }

    console.log('');

    // 5. Test database info
    console.log('5️⃣ Testing database info...');
    try {
      const dbInfo = await prisma.$queryRaw`SELECT DATABASE() as db_name, VERSION() as version`;
      console.log(`✅ Database: ${dbInfo[0].db_name}`);
      console.log(`✅ Version: ${dbInfo[0].version}`);
    } catch (error) {
      console.log('⚠️  Could not retrieve database info');
    }

    console.log('\n🎉 All connection tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('Full error:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Test with timeout
async function testWithTimeout() {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
  );

  try {
    await Promise.race([testConnection(), timeoutPromise]);
  } catch (error) {
    console.error('❌ Test failed or timed out:', error.message);
  }
}

if (require.main === module) {
  console.log('🚀 Database Connection Test\n');
  testWithTimeout();
}

module.exports = { testConnection };