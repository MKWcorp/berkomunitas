/**
 * Run manual SQL migration safely (no prisma reset required)
 * Usage: node prisma/run-migration.js
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function run() {
  const sql = fs.readFileSync(
    path.join(__dirname, 'migrations/manual_tugas_ai_2_submissions.sql'),
    'utf8'
  );

  // Strip query params not supported by pg client
  const dbUrl = process.env.DATABASE_URL.split('?')[0];
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('Connected to:', dbUrl.replace(/:\/\/.*@/, '://***@'));
    await client.query(sql);
    console.log('✅ Migration applied successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
