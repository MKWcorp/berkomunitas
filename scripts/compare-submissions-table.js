/**
 * Check tugas_ai_2_submissions table structure from berkomunitas_dev
 */
const { Client } = require('pg');
require('dotenv').config();

async function checkTableStructure() {
  // Connect to berkomunitas_dev
  const devClient = new Client({
    host: process.env.PGHOST,
    port: process.env.PGPORT || 5432,
    database: 'berkomunitas_dev',
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  });

  // Connect to berkomunitas_db  
  const prodClient = new Client({
    host: process.env.PGHOST,
    port: process.env.PGPORT || 5432,
    database: 'berkomunitas_db',
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  });

  try {
    await devClient.connect();
    await prodClient.connect();
    
    console.log('\n🔍 COMPARING tugas_ai_2_submissions TABLE');
    console.log('='.repeat(70));

    // Check if table exists in DEV
    const devTableCheck = await devClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tugas_ai_2_submissions'
      );
    `);

    if (!devTableCheck.rows[0].exists) {
      console.log('❌ Table tugas_ai_2_submissions does NOT exist in berkomunitas_dev');
      return;
    }

    console.log('✅ Table exists in berkomunitas_dev\n');

    // Get column structure from DEV
    const devColumns = await devClient.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        column_default,
        is_nullable,
        udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tugas_ai_2_submissions'
      ORDER BY ordinal_position;
    `);

    console.log('📋 DEV Database Structure:');
    console.log('-'.repeat(70));
    devColumns.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const maxLen = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`   ${col.column_name}: ${col.data_type}${maxLen} ${nullable}${def}`);
    });

    // Check if table exists in PROD
    const prodTableCheck = await prodClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tugas_ai_2_submissions'
      );
    `);

    console.log('\n📊 PROD Database (berkomunitas_db):');
    console.log('-'.repeat(70));
    
    if (prodTableCheck.rows[0].exists) {
      const prodColumns = await prodClient.query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          column_default,
          is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'tugas_ai_2_submissions'
        ORDER BY ordinal_position;
      `);
      
      console.log('   ✅ Table exists');
      prodColumns.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const maxLen = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`   ${col.column_name}: ${col.data_type}${maxLen} ${nullable}${def}`);
      });
    } else {
      console.log('   ❌ Table does NOT exist - needs to be created');
    }

    // Get indexes from DEV
    console.log('\n🔧 Indexes in DEV:');
    console.log('-'.repeat(70));
    const devIndexes = await devClient.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'tugas_ai_2_submissions'
        AND schemaname = 'public'
      ORDER BY indexname;
    `);
    
    devIndexes.rows.forEach(idx => {
      console.log(`   ${idx.indexname}`);
      console.log(`   → ${idx.indexdef}`);
      console.log('');
    });

    // Get constraints from DEV
    console.log('🔗 Constraints in DEV:');
    console.log('-'.repeat(70));
    const devConstraints = await devClient.query(`
      SELECT
        con.conname AS constraint_name,
        con.contype AS constraint_type,
        pg_get_constraintdef(con.oid) AS constraint_def
      FROM pg_constraint con
      INNER JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'tugas_ai_2_submissions'
        AND rel.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ORDER BY con.conname;
    `);
    
    devConstraints.rows.forEach(con => {
      const type = {
        'p': 'PRIMARY KEY',
        'f': 'FOREIGN KEY',
        'u': 'UNIQUE',
        'c': 'CHECK'
      }[con.constraint_type] || con.constraint_type;
      
      console.log(`   ${con.constraint_name} (${type})`);
      console.log(`   → ${con.constraint_def}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await devClient.end();
    await prodClient.end();
  }
}

checkTableStructure();
