/**
 * Simple Loyalty-Coin Sync Test
 * Test menggunakan database query langsung untuk memverifikasi trigger/function
 */

const { createConnection } = require('mysql2/promise');
require('dotenv').config();

// Database connection dari environment variables
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'komunitas_komentar',
  port: process.env.DATABASE_PORT || 3306
};

async function testLoyaltyCoinSync() {
  let connection;
  
  try {
    console.log('🧪 Starting Simple Loyalty-Coin Sync Test...\n');
    
    // Connect to database
    connection = await createConnection(dbConfig);
    console.log('✅ Connected to database\n');

    // 1. Check if there are any triggers related to loyalty/coin
    console.log('🔍 Step 1: Checking for database triggers...');
    
    const [triggers] = await connection.execute(`
      SELECT 
        TRIGGER_NAME,
        EVENT_MANIPULATION,
        EVENT_OBJECT_TABLE,
        ACTION_STATEMENT
      FROM information_schema.TRIGGERS 
      WHERE EVENT_OBJECT_TABLE = 'user_accounts' 
      AND ACTION_STATEMENT LIKE '%coin%'
    `);

    if (triggers.length === 0) {
      console.log('❌ No triggers found that handle coin updates on user_accounts table');
    } else {
      console.log('✅ Found triggers:');
      triggers.forEach(trigger => {
        console.log(`   - ${trigger.TRIGGER_NAME} (${trigger.EVENT_MANIPULATION})`);
      });
    }
    console.log('');

    // 2. Check for stored procedures/functions
    console.log('🔍 Step 2: Checking for stored procedures/functions...');
    
    const [procedures] = await connection.execute(`
      SELECT 
        ROUTINE_NAME,
        ROUTINE_TYPE,
        ROUTINE_DEFINITION
      FROM information_schema.ROUTINES 
      WHERE ROUTINE_SCHEMA = ? 
      AND (ROUTINE_DEFINITION LIKE '%coin%' OR ROUTINE_DEFINITION LIKE '%loyalty%')
    `, [dbConfig.database]);

    if (procedures.length === 0) {
      console.log('❌ No stored procedures/functions found for loyalty-coin sync');
    } else {
      console.log('✅ Found stored procedures/functions:');
      procedures.forEach(proc => {
        console.log(`   - ${proc.ROUTINE_NAME} (${proc.ROUTINE_TYPE})`);
      });
    }
    console.log('');

    // 3. Get a test user
    console.log('🔍 Step 3: Finding test user...');
    
    const [users] = await connection.execute(`
      SELECT user_id, email, display_name, loyalty_point, coin
      FROM user_accounts 
      WHERE loyalty_point IS NOT NULL AND coin IS NOT NULL
      ORDER BY updated_at DESC
      LIMIT 1
    `);

    if (users.length === 0) {
      console.log('❌ No test user found with both loyalty_point and coin data');
      return;
    }

    const testUser = users[0];
    console.log('✅ Test user found:');
    console.log(`   ID: ${testUser.user_id}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Name: ${testUser.display_name}`);
    console.log(`   Current Loyalty: ${testUser.loyalty_point}`);
    console.log(`   Current Coin: ${testUser.coin}\n`);

    // 4. Test loyalty update
    console.log('🧪 Step 4: Testing loyalty update...');
    
    const initialLoyalty = testUser.loyalty_point;
    const initialCoin = testUser.coin;
    const testAmount = 1000;

    console.log(`   Adding ${testAmount} to loyalty (${initialLoyalty} -> ${initialLoyalty + testAmount})`);
    
    // Update loyalty
    await connection.execute(`
      UPDATE user_accounts 
      SET loyalty_point = loyalty_point + ?
      WHERE user_id = ?
    `, [testAmount, testUser.user_id]);

    // Wait a moment for triggers
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check results
    const [updatedUsers] = await connection.execute(`
      SELECT loyalty_point, coin
      FROM user_accounts 
      WHERE user_id = ?
    `, [testUser.user_id]);

    const updatedUser = updatedUsers[0];
    const newLoyalty = updatedUser.loyalty_point;
    const newCoin = updatedUser.coin;

    console.log('   Results:');
    console.log(`   Loyalty: ${initialLoyalty} -> ${newLoyalty} (Expected: ${initialLoyalty + testAmount})`);
    console.log(`   Coin: ${initialCoin} -> ${newCoin} (Expected: ${initialCoin + testAmount} if trigger works)`);

    const loyaltyCorrect = newLoyalty == (initialLoyalty + testAmount);
    const coinSynced = newCoin == (initialCoin + testAmount);

    console.log(`   ✅ Loyalty Updated: ${loyaltyCorrect ? 'YES' : 'NO'}`);
    console.log(`   ✅ Coin Auto-Synced: ${coinSynced ? 'YES' : 'NO'}\n`);

    // 5. Restore original values
    console.log('🔄 Step 5: Restoring original values...');
    await connection.execute(`
      UPDATE user_accounts 
      SET loyalty_point = ?, coin = ?
      WHERE user_id = ?
    `, [initialLoyalty, initialCoin, testUser.user_id]);
    console.log('✅ Original values restored\n');

    // 6. Final Report
    console.log('📋 FINAL REPORT:');
    console.log('================');
    console.log(`Database Triggers Found: ${triggers.length > 0 ? '✅ YES' : '❌ NO'}`);
    console.log(`Stored Procedures Found: ${procedures.length > 0 ? '✅ YES' : '❌ NO'}`);
    console.log(`Loyalty-Coin Sync Works: ${coinSynced ? '✅ YES' : '❌ NO'}\n`);

    if (!coinSynced) {
      console.log('🔴 DIAGNOSIS:');
      console.log('   Database triggers/functions for loyalty-coin sync are MISSING or BROKEN');
      console.log('   When loyalty is updated, coin is NOT automatically updated');
      console.log('\n💡 RECOMMENDATION:');
      console.log('   Update admin workflow to manually sync coin when loyalty is modified');
      console.log('   Consider creating/restoring the database trigger for automatic sync');
    } else {
      console.log('🟢 DIAGNOSIS:');
      console.log('   Database triggers/functions are working correctly');
      console.log('   Loyalty and coin are automatically synchronized');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

// Quick check function
async function quickSyncCheck() {
  let connection;
  
  try {
    connection = await createConnection(dbConfig);
    
    console.log('🔍 Quick Loyalty-Coin Sync Check...\n');
    
    // Check for mismatched users (where loyalty != coin)
    const [mismatched] = await connection.execute(`
      SELECT 
        COUNT(*) as count,
        AVG(loyalty_point - coin) as avg_difference
      FROM user_accounts 
      WHERE loyalty_point IS NOT NULL 
      AND coin IS NOT NULL 
      AND loyalty_point != coin
    `);

    const mismatchCount = mismatched[0].count;
    const avgDiff = mismatched[0].avg_difference;

    console.log(`Users with mismatched loyalty/coin: ${mismatchCount}`);
    console.log(`Average difference (loyalty - coin): ${avgDiff ? avgDiff.toFixed(2) : 'N/A'}`);

    if (mismatchCount > 0) {
      console.log('⚠️  Some users have mismatched loyalty and coin values');
      console.log('   This might indicate sync issues or historical data inconsistencies');
    } else {
      console.log('✅ All users have matching loyalty and coin values');
    }

  } catch (error) {
    console.error('❌ Quick check failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  console.log('🚀 Loyalty-Coin Synchronization Test Suite\n');
  
  (async () => {
    await quickSyncCheck();
    console.log('\n' + '='.repeat(60) + '\n');
    await testLoyaltyCoinSync();
  })();
}

module.exports = { testLoyaltyCoinSync, quickSyncCheck };