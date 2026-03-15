/**
 * Database Health Monitor
 * Script untuk monitoring kesehatan database dan mendeteksi potensi corruption dini
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://berkomunitas:berkomunitas688@213.190.4.159:5432/berkomunitas_dev";

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 1,
});

async function monitorDatabaseHealth() {
  const client = await pool.connect();
  
  try {
    console.log('🏥 Database Health Monitor');
    console.log('=' .repeat(60));
    console.log(`Timestamp: ${new Date().toISOString()}\n`);
    
    // 1. Check table bloat
    console.log('📊 1. Table Bloat Analysis:');
    const bloat = await client.query(`
      SELECT 
        schemaname,
        relname as tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) AS size,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples,
        ROUND(100 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_tuple_percent
      FROM pg_stat_user_tables
      WHERE relname IN ('task_submissions', 'members', 'tugas_ai', 'comments')
      ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC;
    `);
    
    bloat.rows.forEach(row => {
      const warning = row.dead_tuple_percent > 20 ? '⚠️ ' : '✅ ';
      console.log(`   ${warning}${row.tablename}:`);
      console.log(`      Size: ${row.size}, Dead tuples: ${row.dead_tuple_percent}%`);
    });
    
    // 2. Check database connections
    console.log('\n🔌 2. Database Connections:');
    const connections = await client.query(`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle,
        count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
      FROM pg_stat_activity
      WHERE datname = current_database();
    `);
    
    const conn = connections.rows[0];
    console.log(`   Total: ${conn.total_connections}`);
    console.log(`   Active: ${conn.active}`);
    console.log(`   Idle: ${conn.idle}`);
    if (conn.idle_in_transaction > 0) {
      console.log(`   ⚠️  Idle in transaction: ${conn.idle_in_transaction}`);
    }
    
    // 3. Check for long-running queries
    console.log('\n⏱️  3. Long Running Queries:');
    const longQueries = await client.query(`
      SELECT 
        pid,
        usename,
        state,
        query_start,
        now() - query_start as duration,
        LEFT(query, 100) as query_excerpt
      FROM pg_stat_activity
      WHERE 
        datname = current_database()
        AND state != 'idle'
        AND now() - query_start > interval '30 seconds'
      ORDER BY duration DESC
      LIMIT 5;
    `);
    
    if (longQueries.rows.length > 0) {
      longQueries.rows.forEach(q => {
        console.log(`   ⚠️  PID ${q.pid}: ${q.duration} - ${q.query_excerpt}...`);
      });
    } else {
      console.log('   ✅ No long-running queries');
    }
    
    // 4. Check index health
    console.log('\n🔍 4. Index Health (task_submissions):');
    const indexHealth = await client.query(`
      SELECT 
        indexrelname as index_name,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size
      FROM pg_stat_user_indexes
      WHERE relname = 'task_submissions'
      ORDER BY idx_scan DESC;
    `);
    
    indexHealth.rows.forEach(idx => {
      console.log(`   ${idx.index_name}:`);
      console.log(`      Scans: ${idx.index_scans}, Size: ${idx.index_size}`);
    });
    
    // 5. Check disk usage
    console.log('\n💾 5. Disk Usage:');
    const diskUsage = await client.query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as total_db_size;
    `);
    console.log(`   Total Database Size: ${diskUsage.rows[0].total_db_size}`);
    
    // 6. Recommendations
    console.log('\n💡 6. Recommendations:');
    const recommendations = [];
    
    bloat.rows.forEach(row => {
      if (row.dead_tuple_percent > 20) {
        recommendations.push(`VACUUM table ${row.tablename} (${row.dead_tuple_percent}% dead tuples)`);
      }
    });
    
    if (conn.idle_in_transaction > 5) {
      recommendations.push('Review application code for uncommitted transactions');
    }
    
    if (recommendations.length > 0) {
      recommendations.forEach(rec => console.log(`   ⚠️  ${rec}`));
    } else {
      console.log('   ✅ Database is healthy!');
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error during health check:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

monitorDatabaseHealth()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
