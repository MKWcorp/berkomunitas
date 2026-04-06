/**
 * Run manual migration SQL file to add missing columns
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    host: process.env.PGHOST,
    port: process.env.PGPORT || 5432,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read SQL file
    const sqlFile = path.join(__dirname, '..', 'prisma', 'migrations', 'add_tugas_ai_2_missing_columns.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('\n📝 Running migration...');
    console.log('='.repeat(70));
    
    // Execute SQL
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Added columns:');
    console.log('   - tugas_ai_2.expires_at (TIMESTAMPTZ)');
    console.log('   - tugas_ai_2.tiktok_content_id (INTEGER)');
    console.log('   - tugas_ai_2.max_submissions (INTEGER DEFAULT 1)');
    console.log('\n🔧 Added indexes:');
    console.log('   - tugas_ai_2_expires_at_idx');
    console.log('   - tugas_ai_2_tiktok_content_id_idx');
    
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

runMigration();
