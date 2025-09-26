// Debug script untuk memeriksa masalah /api/events
// Jalankan dengan: node debug-events-api.mjs

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function debugEventsAPI() {
  console.log('🔍 DEBUGGING /api/events Issue...\n');
  
  try {
    // 1. Cek apakah tabel event_settings ada
    console.log('1️⃣ Checking event_settings table...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'event_settings'
      );
    `);
    console.log('   Table exists:', tableCheck.rows[0].exists);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Table event_settings does not exist!');
      console.log('   Please run: create-event-settings-table.sql');
      return;
    }
    
    // 2. Cek isi tabel event_settings
    console.log('\n2️⃣ Checking event_settings data...');
    const eventsData = await pool.query('SELECT * FROM event_settings ORDER BY start_date DESC');
    console.log('   Events count:', eventsData.rows.length);
    if (eventsData.rows.length > 0) {
      console.log('   Sample event:', eventsData.rows[0]);
    } else {
      console.log('   No events found in table');
    }
    
    // 3. Cek admin privilege untuk wiro@drwcorp.com
    console.log('\n3️⃣ Checking admin privilege for wiro@drwcorp.com...');
    const adminCheck = await pool.query(`
      SELECT * FROM user_privileges 
      WHERE user_email = 'wiro@drwcorp.com' 
      AND privilege = 'admin'
    `);
    
    console.log('   Admin records found:', adminCheck.rows.length);
    if (adminCheck.rows.length > 0) {
      adminCheck.rows.forEach((row, idx) => {
        console.log(`   Admin record ${idx + 1}:`, {
          id: row.id,
          user_email: row.user_email,
          privilege: row.privilege,
          is_active: row.is_active,
          created_at: row.created_at
        });
      });
      
      const activeAdmin = adminCheck.rows.find(row => row.is_active);
      console.log('   Has active admin privilege:', !!activeAdmin);
      
      if (!activeAdmin) {
        console.log('❌ Admin privilege exists but not active!');
        console.log('   Fixing admin privilege...');
        
        await pool.query(`
          UPDATE user_privileges 
          SET is_active = true 
          WHERE user_email = 'wiro@drwcorp.com' 
          AND privilege = 'admin'
        `);
        console.log('✅ Admin privilege activated');
      }
    } else {
      console.log('❌ No admin privilege found for wiro@drwcorp.com');
      console.log('   Creating admin privilege...');
      
      await pool.query(`
        INSERT INTO user_privileges (user_email, privilege, is_active)
        VALUES ('wiro@drwcorp.com', 'admin', true)
        ON CONFLICT (user_email, privilege) 
        DO UPDATE SET is_active = true
      `);
      console.log('✅ Admin privilege created');
    }
    
    // 4. Test API endpoint logic simulation
    console.log('\n4️⃣ Simulating API endpoint logic...');
    const email = 'wiro@drwcorp.com';
    
    const adminPrivilege = await pool.query(`
      SELECT * FROM user_privileges
      WHERE user_email = $1 
      AND privilege = 'admin' 
      AND is_active = true
    `, [email]);
    
    console.log('   Email used:', email);
    console.log('   Admin privilege found:', adminPrivilege.rows.length > 0);
    
    if (adminPrivilege.rows.length > 0) {
      const events = await pool.query('SELECT * FROM event_settings ORDER BY start_date DESC');
      console.log('   Would return events count:', events.rows.length);
      console.log('✅ API should work now');
    } else {
      console.log('❌ API would still return 403');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  debugEventsAPI();
}

export default debugEventsAPI;
