/**
 * Script untuk memperbaiki index corruption pada task_submissions_pkey
 * Error: heap tid from index tuple points to heap-only tuple
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://berkomunitas:berkomunitas688@213.190.4.159:5432/berkomunitas_dev";

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 1,
});

async function fixIndexCorruption() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Memulai perbaikan index corruption...\n');
    
    // Step 1: REINDEX primary key
    console.log('Step 1/3: REINDEX INDEX task_submissions_pkey...');
    await client.query('REINDEX INDEX task_submissions_pkey;');
    console.log('✅ REINDEX berhasil\n');
    
    // Step 2: VACUUM ANALYZE
    console.log('Step 2/3: VACUUM ANALYZE task_submissions...');
    await client.query('VACUUM ANALYZE task_submissions;');
    console.log('✅ VACUUM ANALYZE berhasil\n');
    
    // Step 3: Verify data
    console.log('Step 3/3: Verifikasi data ID 33678...');
    const result = await client.query('SELECT id, status_submission FROM task_submissions WHERE id = 33678;');
    if (result.rows.length > 0) {
      console.log('✅ Data ditemukan:', result.rows[0]);
    } else {
      console.log('⚠️  Data ID 33678 tidak ditemukan (mungkin sudah dihapus)');
    }
    
    console.log('\n🎉 Perbaikan index selesai! Workflow n8n seharusnya sudah bisa berjalan normal.');
    
  } catch (error) {
    console.error('❌ Error saat perbaikan:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixIndexCorruption()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
