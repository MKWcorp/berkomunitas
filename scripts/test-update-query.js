/**
 * Test UPDATE Query - Simulasi query yang error di n8n workflow
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://berkomunitas:berkomunitas688@213.190.4.159:5432/berkomunitas_dev";

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 5,
});

async function testUpdateQuery() {
  console.log('🧪 Testing UPDATE Query - Simulasi n8n workflow\n');
  console.log('=' .repeat(60));
  
  const client = await pool.connect();
  
  try {
    // Step 1: Cari submission yang sedang_verifikasi untuk test
    console.log('\n📋 Step 1: Mencari data untuk test...');
    const findSubmission = await client.query(`
      SELECT id, id_member, id_task, status_submission
      FROM task_submissions
      WHERE status_submission = 'sedang_verifikasi'
      ORDER BY waktu_klik DESC
      LIMIT 1;
    `);
    
    if (findSubmission.rows.length === 0) {
      console.log('   ℹ️  Tidak ada submission dengan status sedang_verifikasi');
      console.log('   ℹ️  Membuat data dummy untuk test...');
      
      // Ambil salah satu submission untuk test
      const anySubmission = await client.query(`
        SELECT id FROM task_submissions LIMIT 1;
      `);
      
      if (anySubmission.rows.length === 0) {
        console.log('   ❌ Tidak ada data di task_submissions');
        return;
      }
      
      const testId = anySubmission.rows[0].id;
      console.log(`   ✅ Menggunakan ID ${testId} untuk test`);
      
      // Test UPDATE dengan query yang sama seperti n8n
      console.log('\n🔧 Step 2: Testing UPDATE seperti n8n workflow...');
      const result = await client.query(`
        UPDATE task_submissions
        SET
          status_submission = 'selesai',
          tanggal_verifikasi = NOW()
        WHERE id = $1
        RETURNING json_build_object(
          'id', id,
          'id_member', id_member,
          'id_task', id_task,
          'status_submission', status_submission,
          'tanggal_verifikasi', tanggal_verifikasi,
          'updated_at', now()
        ) AS updated_submission;
      `, [testId]);
      
      console.log('   ✅ UPDATE berhasil!');
      console.log('   📊 Result:', JSON.stringify(result.rows[0].updated_submission, null, 2));
      
      // Rollback untuk tidak mengubah data sebenarnya
      console.log('\n↩️  Rollback perubahan...');
      await client.query('ROLLBACK');
      console.log('   ✅ Data dikembalikan ke kondisi awal');
      
    } else {
      const testSubmission = findSubmission.rows[0];
      console.log(`   ✅ Ditemukan submission ID: ${testSubmission.id}`);
      console.log(`      Member: ${testSubmission.id_member}, Task: ${testSubmission.id_task}`);
      console.log(`      Status: ${testSubmission.status_submission}`);
      
      // Test UPDATE dengan query PERSIS seperti n8n (dalam transaction)
      console.log('\n🔧 Step 2: Testing UPDATE (PERSIS seperti n8n)...');
      
      await client.query('BEGIN');
      
      try {
        const result = await client.query(`
          UPDATE task_submissions
          SET
            status_submission = 'selesai',
            tanggal_verifikasi = NOW()
          WHERE id = $1
          RETURNING json_build_object(
            'id', id,
            'id_member', id_member,
            'id_task', id_task,
            'status_submission', status_submission,
            'tanggal_verifikasi', tanggal_verifikasi,
            'updated_at', now()
          ) AS updated_submission;
        `, [testSubmission.id]);
        
        console.log('   ✅ UPDATE berhasil!');
        console.log('   📊 Result:', JSON.stringify(result.rows[0].updated_submission, null, 2));
        
        // Rollback untuk tidak mengubah data
        await client.query('ROLLBACK');
        console.log('\n↩️  ✅ Rollback - Data tidak diubah');
        
      } catch (updateError) {
        await client.query('ROLLBACK');
        throw updateError;
      }
    }
    
    // Step 3: Test multiple updates (stress test)
    console.log('\n🏋️  Step 3: Stress test - Multiple UPDATEs...');
    
    const randomIds = await client.query(`
      SELECT id FROM task_submissions 
      ORDER BY RANDOM() 
      LIMIT 5;
    `);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const row of randomIds.rows) {
      try {
        await client.query('BEGIN');
        await client.query(`
          UPDATE task_submissions
          SET status_submission = status_submission
          WHERE id = $1;
        `, [row.id]);
        await client.query('ROLLBACK');
        successCount++;
      } catch (err) {
        errorCount++;
        console.log(`   ❌ Error on ID ${row.id}: ${err.message}`);
        await client.query('ROLLBACK');
      }
    }
    
    console.log(`   ✅ Success: ${successCount}/${randomIds.rows.length}`);
    console.log(`   ❌ Errors: ${errorCount}/${randomIds.rows.length}`);
    
    // Final verdict
    console.log('\n' + '='.repeat(60));
    console.log('🎯 VERDICT:');
    
    if (errorCount === 0) {
      console.log('   ✅✅✅ CORRUPTION SUDAH HILANG!');
      console.log('   ✅ Workflow n8n seharusnya bisa berjalan normal sekarang');
      console.log('\n   💡 Silakan test workflow "VALIDASI TUGAS" di n8n');
    } else {
      console.log('   ❌ Masih ada error - Corruption belum sepenuhnya teratasi');
      console.log('   ⚠️  Kemungkinan masalah hardware atau PostgreSQL bug');
      console.log('   📞 Pertimbangkan untuk:');
      console.log('      1. Check disk health (fsck, SMART check)');
      console.log('      2. Upgrade PostgreSQL ke versi terbaru');
      console.log('      3. Migrate ke server baru');
    }
    
  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

testUpdateQuery()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
