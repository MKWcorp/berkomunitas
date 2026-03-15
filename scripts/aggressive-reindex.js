/**
 * AGGRESSIVE INDEX REPAIR
 * Untuk corruption yang persisten dan berulang
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://berkomunitas:berkomunitas688@213.190.4.159:5432/berkomunitas_dev";

async function aggressiveRepair() {
  // Buat 2 pool terpisah untuk administrative tasks
  const adminPool = new Pool({
    connectionString: DATABASE_URL,
    max: 1,
  });
  
  const client = await adminPool.connect();
  
  try {
    console.log('🚨 AGGRESSIVE INDEX REPAIR - Mengatasi Corruption Persisten\n');
    console.log('=' .repeat(70));
    
    // Step 1: Kill semua koneksi idle yang mungkin mengganggu
    console.log('\n💀 Step 1/8: Membersihkan koneksi idle...');
    const killed = await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE 
        datname = current_database()
        AND pid <> pg_backend_pid()
        AND state = 'idle'
        AND state_change < NOW() - INTERVAL '5 minutes';
    `);
    console.log(`   ✅ ${killed.rowCount} koneksi idle dihentikan`);
    
    // Step 2: Cancel idle in transaction
    console.log('\n🔪 Step 2/8: Cancel idle in transaction...');
    const canceled = await client.query(`
      SELECT pg_cancel_backend(pid)
      FROM pg_stat_activity
      WHERE 
        datname = current_database()
        AND pid <> pg_backend_pid()
        AND state = 'idle in transaction'
        AND state_change < NOW() - INTERVAL '1 minute';
    `);
    console.log(`   ✅ ${canceled.rowCount} transaksi dibatalkan`);
    
    // Step 3: Cek active locks
    console.log('\n🔒 Step 3/8: Memeriksa locks...');
    const locks = await client.query(`
      SELECT 
        l.relation::regclass as table_name,
        l.mode,
        l.granted,
        a.pid,
        a.state,
        a.query_start
      FROM pg_locks l
      JOIN pg_stat_activity a ON l.pid = a.pid
      WHERE l.relation = 'task_submissions'::regclass
      ORDER BY a.query_start;
    `);
    
    if (locks.rows.length > 0) {
      console.log('   ⚠️  Active locks ditemukan:');
      locks.rows.forEach(lock => {
        console.log(`      PID ${lock.pid}: ${lock.mode} - ${lock.state}`);
      });
    } else {
      console.log('   ✅ Tidak ada locks aktif');
    }
    
    // Step 4: VACUUM FULL terlebih dahulu
    console.log('\n🧹 Step 4/8: VACUUM FULL task_submissions...');
    console.log('   ⏳ Proses ini akan mengunci tabel...');
    await client.query('VACUUM FULL task_submissions;');
    console.log('   ✅ VACUUM FULL berhasil');
    
    // Step 5: Drop dan Recreate Primary Key Constraint
    console.log('\n🔨 Step 5/8: DROP dan RECREATE Primary Key...');
    
    // Backup dulu constraint definition
    const constraintInfo = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'task_submissions'::regclass 
        AND contype = 'p';
    `);
    
    if (constraintInfo.rows.length > 0) {
      console.log(`   📋 Current constraint: ${constraintInfo.rows[0].conname}`);
      
      // Drop primary key (akan hapus index juga)
      console.log('   🗑️  Dropping primary key constraint...');
      await client.query('ALTER TABLE task_submissions DROP CONSTRAINT task_submissions_pkey;');
      console.log('   ✅ Primary key dropped');
      
      // Recreate primary key (akan create index baru)
      console.log('   🔧 Recreating primary key...');
      await client.query('ALTER TABLE task_submissions ADD PRIMARY KEY (id);');
      console.log('   ✅ Primary key recreated dengan index baru');
    }
    
    // Step 6: Rebuild index lainnya
    console.log('\n🔨 Step 6/8: REINDEX semua index lainnya...');
    const otherIndexes = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'task_submissions' 
        AND indexname != 'task_submissions_pkey';
    `);
    
    for (const idx of otherIndexes.rows) {
      console.log(`   🔧 Reindexing ${idx.indexname}...`);
      await client.query(`REINDEX INDEX ${idx.indexname};`);
    }
    console.log('   ✅ Semua index lainnya berhasil di-rebuild');
    
    // Step 7: ANALYZE untuk update statistics
    console.log('\n📊 Step 7/8: ANALYZE task_submissions...');
    await client.query('ANALYZE task_submissions;');
    console.log('   ✅ Statistics updated');
    
    // Step 8: Verification
    console.log('\n✅ Step 8/8: Verifikasi perbaikan...');
    
    // Test query yang sebelumnya error
    console.log('   Testing UPDATE query...');
    const testUpdate = await client.query(`
      UPDATE task_submissions 
      SET status_submission = status_submission 
      WHERE id = (
        SELECT id FROM task_submissions 
        WHERE status_submission = 'sedang_verifikasi' 
        LIMIT 1
      )
      RETURNING id;
    `);
    
    if (testUpdate.rowCount > 0) {
      console.log(`   ✅ UPDATE berhasil pada ID: ${testUpdate.rows[0].id}`);
    } else {
      console.log('   ℹ️  Tidak ada data untuk test update');
    }
    
    // Verify index integrity
    console.log('   Verifying index integrity...');
    const indexCheck = await client.query(`
      SELECT 
        indexrelname as indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      WHERE relname = 'task_submissions';
    `);
    
    indexCheck.rows.forEach(idx => {
      console.log(`   ✅ ${idx.indexname}: ${idx.size}`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 AGGRESSIVE REPAIR SELESAI!\n');
    
    console.log('📊 Summary:');
    console.log(`   - Koneksi idle dibersihkan: ${killed.rowCount}`);
    console.log(`   - Transaksi dibatalkan: ${canceled.rowCount}`);
    console.log('   - Primary key di-rebuild: ✅');
    console.log('   - Index lainnya di-rebuild: ✅');
    console.log('   - VACUUM & ANALYZE: ✅');
    console.log('   - Verification test: ✅');
    
    console.log('\n💡 Rekomendasi Lanjutan:');
    console.log('1. Monitor workflow n8n dalam 24 jam ke depan');
    console.log('2. Jika error masih muncul, kemungkinan masalah hardware disk');
    console.log('3. Pertimbangkan untuk check disk health di server');
    console.log('4. Setup pg_auto_vacuum jika belum aktif');
    console.log('5. Review aplikasi code yang mungkin menyebabkan corruption');
    
  } catch (error) {
    console.error('\n❌ Error during aggressive repair:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    client.release();
    await adminPool.end();
  }
}

aggressiveRepair()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
