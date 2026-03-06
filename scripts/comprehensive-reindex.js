/**
 * Comprehensive Index Repair & Verification Script
 * Untuk mengatasi corruption yang berulang pada task_submissions
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://berkomunitas:berkomunitas688@213.190.4.159:5432/berkomunitas_dev";

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 1,
});

async function comprehensiveRepair() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Perbaikan Komprehensif Index Corruption\n');
    console.log('=' .repeat(60));
    
    // Step 1: Check for corruption signs
    console.log('\n📊 Step 1/6: Memeriksa tanda-tanda corruption...');
    const corruptCheck = await client.query(`
      SELECT 
        COUNT(*) as total_rows,
        COUNT(DISTINCT id) as unique_ids,
        MAX(id) as max_id
      FROM task_submissions;
    `);
    console.log('   Total rows:', corruptCheck.rows[0].total_rows);
    console.log('   Unique IDs:', corruptCheck.rows[0].unique_ids);
    console.log('   Max ID:', corruptCheck.rows[0].max_id);
    
    // Step 2: REINDEX entire table (semua index)
    console.log('\n🔨 Step 2/6: REINDEX TABLE task_submissions (semua index)...');
    await client.query('REINDEX TABLE task_submissions;');
    console.log('   ✅ REINDEX TABLE berhasil');
    
    // Step 3: VACUUM FULL (lebih menyeluruh)
    console.log('\n🧹 Step 3/6: VACUUM FULL ANALYZE task_submissions...');
    console.log('   ⏳ Proses ini mungkin memakan waktu...');
    await client.query('VACUUM FULL ANALYZE task_submissions;');
    console.log('   ✅ VACUUM FULL berhasil');
    
    // Step 4: Check all indexes
    console.log('\n📋 Step 4/6: Memeriksa semua index pada task_submissions...');
    const indexes = await client.query(`
      SELECT 
        indexname, 
        indexdef 
      FROM pg_indexes 
      WHERE tablename = 'task_submissions';
    `);
    console.log('   Index yang ditemukan:');
    indexes.rows.forEach(idx => {
      console.log(`   - ${idx.indexname}`);
    });
    
    // Step 5: Test UPDATE operation
    console.log('\n🧪 Step 5/6: Testing UPDATE operation...');
    try {
      // Ambil salah satu record untuk test
      const testRecord = await client.query(`
        SELECT id FROM task_submissions 
        WHERE status_submission = 'sedang_verifikasi' 
        LIMIT 1;
      `);
      
      if (testRecord.rows.length > 0) {
        const testId = testRecord.rows[0].id;
        console.log(`   Testing dengan ID: ${testId}`);
        
        await client.query(`
          UPDATE task_submissions 
          SET status_submission = status_submission 
          WHERE id = $1;
        `, [testId]);
        console.log('   ✅ UPDATE test berhasil');
      } else {
        console.log('   ℹ️  Tidak ada data sedang_verifikasi untuk test');
      }
    } catch (testError) {
      console.log('   ❌ UPDATE test gagal:', testError.message);
    }
    
    // Step 6: Recommendations
    console.log('\n💡 Step 6/6: Rekomendasi...');
    
    // Check disk space info
    const dbSize = await client.query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as db_size,
        pg_size_pretty(pg_total_relation_size('task_submissions')) as table_size;
    `);
    console.log('   Database size:', dbSize.rows[0].db_size);
    console.log('   Table size:', dbSize.rows[0].table_size);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Perbaikan selesai!');
    console.log('\nJika error masih muncul, kemungkinan penyebab:');
    console.log('1. Disk space hampir penuh');
    console.log('2. Hardware disk bermasalah');
    console.log('3. Koneksi database tidak stabil');
    console.log('4. Beban database terlalu tinggi');
    console.log('\nSolusi lanjutan:');
    console.log('- Monitoring disk space secara berkala');
    console.log('- Pertimbangkan upgrade hardware');
    console.log('- Setup connection pooling yang lebih baik');
    
  } catch (error) {
    console.error('\n❌ Error saat perbaikan:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

comprehensiveRepair()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
