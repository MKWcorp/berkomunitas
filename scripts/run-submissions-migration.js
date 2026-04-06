/**
 * Run migration to create tugas_ai_2_submissions table
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
    const sqlFile = path.join(__dirname, '..', 'prisma', 'migrations', 'create_tugas_ai_2_submissions.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('\n📝 Running migration: create_tugas_ai_2_submissions');
    console.log('='.repeat(70));
    
    // Execute SQL
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Created table:');
    console.log('   - tugas_ai_2_submissions');
    console.log('\n🔧 Created indexes:');
    console.log('   - tugas_ai_2_id_idx');
    console.log('   - member_id_idx');
    console.log('   - status_idx');
    console.log('   - platform_idx');
    console.log('   - batas_waktu_idx');
    console.log('   - member_status_idx');
    console.log('   - platform_status_idx');
    console.log('   - created_at_idx');
    
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

runMigration();
