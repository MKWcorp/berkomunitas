require('dotenv').config();
const { Client } = require('pg');

async function compareScreenshotsTable() {
  // DEV database
  const devClient = new Client({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: 'berkomunitas_dev'
  });

  // PROD database
  const prodClient = new Client({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: 'berkomunitas_db'
  });

  try {
    await devClient.connect();
    await prodClient.connect();

    console.log('\n📊 COMPARING tugas_ai_2_screenshots TABLE');
    console.log('='.repeat(70));

    // Check table existence and get columns
    const devTableQuery = `
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'tugas_ai_2_screenshots'
      ORDER BY ordinal_position;
    `;

    const devResult = await devClient.query(devTableQuery);
    const prodResult = await prodClient.query(devTableQuery);

    // Display DEV structure
    console.log('\n✅ DEV Database Structure:');
    console.log('-'.repeat(70));
    if (devResult.rows.length > 0) {
      devResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const type = col.character_maximum_length 
          ? `${col.data_type}(${col.character_maximum_length})`
          : col.data_type;
        const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`   ${col.column_name}: ${type} ${nullable}${def}`);
      });
    } else {
      console.log('   ❌ Table does NOT exist');
    }

    // Display PROD structure
    console.log('\n📊 PROD Database (berkomunitas_db):');
    console.log('-'.repeat(70));
    if (prodResult.rows.length > 0) {
      prodResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const type = col.character_maximum_length 
          ? `${col.data_type}(${col.character_maximum_length})`
          : col.data_type;
        const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`   ${col.column_name}: ${type} ${nullable}${def}`);
      });
    } else {
      console.log('   ❌ Table does NOT exist');
    }

    // Find differences
    console.log('\n🔍 Differences:');
    console.log('-'.repeat(70));
    
    const devColumns = new Set(devResult.rows.map(r => r.column_name));
    const prodColumns = new Set(prodResult.rows.map(r => r.column_name));
    
    const missingInProd = [...devColumns].filter(c => !prodColumns.has(c));
    const missingInDev = [...prodColumns].filter(c => !devColumns.has(c));
    
    if (missingInProd.length > 0) {
      console.log(`   ⚠️  Missing in PROD: ${missingInProd.join(', ')}`);
    }
    if (missingInDev.length > 0) {
      console.log(`   ⚠️  Missing in DEV: ${missingInDev.join(', ')}`);
    }
    if (missingInProd.length === 0 && missingInDev.length === 0) {
      console.log('   ✅ All columns match!');
    }

    // Get indexes
    const indexQuery = `
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'tugas_ai_2_screenshots'
      ORDER BY indexname;
    `;

    const devIndexes = await devClient.query(indexQuery);
    const prodIndexes = await prodClient.query(indexQuery);

    console.log('\n📑 Indexes in DEV:');
    console.log('-'.repeat(70));
    devIndexes.rows.forEach(idx => {
      console.log(`   ${idx.indexname}`);
      console.log(`   → ${idx.indexdef}\n`);
    });

    console.log('📑 Indexes in PROD:');
    console.log('-'.repeat(70));
    if (prodIndexes.rows.length > 0) {
      prodIndexes.rows.forEach(idx => {
        console.log(`   ${idx.indexname}`);
        console.log(`   → ${idx.indexdef}\n`);
      });
    } else {
      console.log('   (No indexes found)\n');
    }

    // Get constraints
    const constraintQuery = `
      SELECT
        conname,
        contype,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'tugas_ai_2_screenshots'::regclass
      ORDER BY conname;
    `;

    const devConstraints = await devClient.query(constraintQuery);
    const prodConstraints = await prodClient.query(constraintQuery);

    console.log('🔒 Constraints in DEV:');
    console.log('-'.repeat(70));
    devConstraints.rows.forEach(con => {
      const type = {
        'p': 'PRIMARY KEY',
        'f': 'FOREIGN KEY',
        'u': 'UNIQUE',
        'c': 'CHECK'
      }[con.contype] || con.contype;
      console.log(`   ${con.conname} (${type})`);
      console.log(`   → ${con.definition}\n`);
    });

    console.log('🔒 Constraints in PROD:');
    console.log('-'.repeat(70));
    if (prodConstraints.rows.length > 0) {
      prodConstraints.rows.forEach(con => {
        const type = {
          'p': 'PRIMARY KEY',
          'f': 'FOREIGN KEY',
          'u': 'UNIQUE',
          'c': 'CHECK'
        }[con.contype] || con.contype;
        console.log(`   ${con.conname} (${type})`);
        console.log(`   → ${con.definition}\n`);
      });
    } else {
      console.log('   (No constraints found)\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await devClient.end();
    await prodClient.end();
  }
}

compareScreenshotsTable();
